class_name FallChunk
extends Node3D

signal portal_entered(index: int)
signal coin_collected(key: String, where: Vector3)

static var geometry: Dictionary = {}
var area: Dictionary
var surfaces: Array[StaticBody3D] = []
var coins: Array[Node3D] = []
var gate: Node3D
var enemy: Node3D
var broken := false
var time := 0.0
var draw_batches := 0

static func wedge(inner: float, outer: float, arc: float, depth: float) -> Dictionary:
	var key := "%f/%f/%f/%f" % [inner, outer, arc, depth]
	if geometry.has(key):
		return geometry[key]
	var verts: Array[Vector3] = []
	for y in [0.0, -depth]:
		for r in [inner, outer]:
			for i in 4:
				var a := arc * i / 3.0
				verts.append(Vector3(sin(a) * r, y, cos(a) * r))
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	st.set_smooth_group(-1)
	for i in 3:
		for triangle in [[i, i + 4, i + 5], [i, i + 5, i + 1], [i + 8, i + 13, i + 12], [i + 8, i + 9, i + 13], [i + 4, i + 12, i + 13], [i + 4, i + 13, i + 5], [i, i + 1, i + 9], [i, i + 9, i + 8]]:
			for vertex_index in range(2, -1, -1):
				st.add_vertex(verts[triangle[vertex_index]])
	for triangle in [[0, 8, 12], [0, 12, 4], [3, 7, 15], [3, 15, 11]]:
		for vertex_index in range(2, -1, -1):
			st.add_vertex(verts[triangle[vertex_index]])
	st.generate_normals()
	var shape := ConvexPolygonShape3D.new()
	shape.points = PackedVector3Array(verts)
	var result := {"mesh": st.commit(), "shape": shape}
	geometry[key] = result
	return result

func build(definition: Dictionary, collected: Dictionary) -> void:
	area = definition
	position.y = area.y
	rotation.y = area.angle
	var batches: Dictionary = {}
	for tile in area.tiles:
		tile["collapsed"] = false
		var body := StaticBody3D.new()
		var height := float(tile.height) * FallCourse.UNIT
		var inner := 1.62 + float(tile.lane) * 1.08
		var outer := inner + 1.08
		if tile.get("wide", false):
			inner = 1.29
			outer = 4.44
		var geo := wedge(inner, outer, float(tile.get("width", 1.0)) * FallCourse.STEP, 0.54 + height)
		body.position.y = height
		body.rotation.y = float(tile.cell) * FallCourse.STEP
		body.set_meta("tile", tile)
		body.set_meta("area", int(area.index))
		body.set_meta("standing", 0.0)
		body.add_to_group("floor")
		add_child(body)
		var color := Color("688ac2")
		if tile.get("fragile", false):
			color = Color("2ac3df")
		if tile.get("exit", false) or tile.get("bonus", false):
			color = Color("ffd05a")
		if tile.get("danger", false):
			color = Color("e64f75")
		var batch_key := str(geo.mesh.get_rid()) + str(color)
		if not batches.has(batch_key):
			batches[batch_key] = {"mesh": geo.mesh, "color": color, "bodies": []}
		batches[batch_key].bodies.append(body)
		var collision := CollisionShape3D.new()
		collision.shape = geo.shape
		body.add_child(collision)
		body.set_meta("collision", collision)
		surfaces.append(body)
		if not area.get("ring", false) and not tile.get("exit", false):
			if int(tile.lane) == 2 and int(tile.cell + area.index) % 3 == 0 and not tile.get("fragile", false):
				var grass := FallArt.box(body, Vector3(0.10, 0.08, 0.34), Color("32cd92"), Vector3(sin(FallCourse.STEP * 0.5) * (outer - 0.07), 0.03, cos(FallCourse.STEP * 0.5) * (outer - 0.07)))
				grass.rotation.y = FallCourse.STEP * 0.5
			if int(tile.lane) == 2 and int(tile.cell + area.index) % 7 == 2 and not tile.get("coin", false):
				FallArt.crystal(body, FallCourse.point(2, 0.5, 0.0, 0.0), 0.5)
		if tile.get("coin", false):
			var key := "%d:%d:%d" % [area.index, tile.lane, tile.cell]
			if not collected.has(key):
				var coin := FallArt.ball(self, Vector3(0.22, 0.30, 0.08), Color("ffdd68"), FallCourse.point(tile.lane, tile.cell + 0.5, 0, height + 0.60))
				coin.set_meta("key", key)
				coin.set_meta("base", coin.position.y)
				coins.append(coin)
	# One draw per material/shape group instead of one draw per platform tile.
	# Collision shapes stay native and independent, including breakable bridges.
	for group in batches.values():
		var batch := MultiMeshInstance3D.new()
		batch.multimesh = MultiMesh.new()
		batch.multimesh.transform_format = MultiMesh.TRANSFORM_3D
		batch.multimesh.mesh = group.mesh
		batch.multimesh.instance_count = group.bodies.size()
		batch.material_override = FallArt.material(group.color)
		add_child(batch)
		draw_batches += 1
		for i in group.bodies.size():
			var floor_body: StaticBody3D = group.bodies[i]
			batch.multimesh.set_instance_transform(i, floor_body.transform)
			floor_body.set_meta("batch", batch)
			floor_body.set_meta("instance", i)

	if area.has("exit"):
		var exit: Dictionary = area.exit
		gate = FallArt.portal(self, FallCourse.point(exit.lane, exit.cell + 0.5), (exit.cell + 0.5) * FallCourse.STEP + PI / 2.0)
		var trigger := Area3D.new()
		gate.add_child(trigger)
		var shape := CylinderShape3D.new()
		shape.radius = 0.42
		shape.height = 1.4
		var collision := CollisionShape3D.new()
		collision.position.y = 0.65
		collision.shape = shape
		trigger.add_child(collision)
		trigger.body_entered.connect(func(body: Node3D):
			if body is FallPlayer:
				portal_entered.emit(int(area.index)))
	if area.get("patrol") is Dictionary:
		enemy = FallEnemy.new()
		add_child(enemy)
		enemy.setup(area.patrol)

func update_visuals(delta: float, player: Node3D) -> void:
	time += delta
	for coin in coins.duplicate():
		coin.rotation.y += delta * 2.0
		coin.position.y = float(coin.get_meta("base")) + sin(time * 3.0) * 0.06
		if player.global_position.distance_to(coin.global_position - Vector3.UP * 0.2) < 0.75:
			coin_collected.emit(coin.get_meta("key"), coin.global_position)
			coins.erase(coin)
			coin.queue_free()
	if is_instance_valid(enemy):
		enemy.tick(delta)

func stand_on(body: StaticBody3D, delta: float) -> bool:
	var tile: Dictionary = body.get_meta("tile")
	if tile.get("danger", false):
		return true
	if tile.get("fragile", false):
		var standing: float = body.get_meta("standing") + delta
		body.set_meta("standing", standing)
		if area.get("ring", false) or standing >= 0.75:
			tile["collapsed"] = true
			var batch: MultiMeshInstance3D = body.get_meta("batch")
			batch.multimesh.set_instance_transform(body.get_meta("instance"), Transform3D(Basis.from_scale(Vector3.ZERO), Vector3.ZERO))
			body.get_meta("collision").set_deferred("disabled", true)
	return false

func smash() -> void:
	broken = true
	visible = false
	for body in surfaces:
		body.get_meta("collision").set_deferred("disabled", true)
