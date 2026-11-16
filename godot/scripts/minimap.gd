class_name FallMinimap
extends Control

var game: Node3D
var elapsed := 0.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _process(delta: float) -> void:
	visible = game.mode == "playing" and game.stage == 1
	elapsed += delta
	if visible and elapsed >= 0.1:
		elapsed = 0
		queue_redraw()

func _draw() -> void:
	if game.areas.is_empty():
		return
	var area: Dictionary = game.areas[mini(game.index, game.areas.size() - 1)]
	var center := size * 0.5
	var factor := size.x / 11.5
	draw_circle(center, size.x * 0.5, Color(0.04, 0.12, 0.22, 0.88))
	draw_arc(center, size.x * 0.5 - 1, 0, TAU, 40, Color("497a98"), 1.5, true)
	draw_circle(center, 1.29 * factor, Color("345778"))
	for tile in area.tiles:
		if tile.get("collapsed", false):
			continue
		var inner: float = 1.62 + float(tile.lane) * 1.08
		var outer := inner + 1.08
		var a: float = float(area.angle) + float(tile.cell) * FallCourse.STEP - game.camera_angle
		var points := PackedVector2Array()
		for i in 4:
			var angle: float = a + i * FallCourse.STEP / 3.0
			points.append(center + Vector2(sin(angle), cos(angle)) * outer * factor)
		for i in range(3, -1, -1):
			var angle: float = a + i * FallCourse.STEP / 3.0
			points.append(center + Vector2(sin(angle), cos(angle)) * inner * factor)
		var color := Color("789ed8")
		if tile.get("fragile", false):
			color = Color("31e1ec")
		elif tile.get("exit", false):
			color = Color("ffda66")
		elif tile.height > 0:
			color = Color("b8a0ed")
		draw_colored_polygon(points, color)
	var pos: Vector3 = game.player.position
	var angle: float = atan2(pos.x, pos.z) - game.camera_angle
	var point := center + Vector2(sin(angle), cos(angle)) * Vector2(pos.x, pos.z).length() * factor
	draw_circle(point, 4.5, Color("0b2439"))
	draw_circle(point, 3, Color("87ffca"))
