class_name FallArt
extends RefCounted

static var materials: Dictionary = {}

static func material(color: Color, glow: float = 0.0) -> StandardMaterial3D:
	var key := str(color) + str(glow)
	if materials.has(key):
		return materials[key]
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.8
	if glow > 0.0:
		mat.emission_enabled = true
		mat.emission = color
		mat.emission_energy_multiplier = glow
	materials[key] = mat
	return mat

static func mesh(parent: Node3D, shape: Mesh, color: Color, at := Vector3.ZERO, glow := 0.0) -> MeshInstance3D:
	var part := MeshInstance3D.new()
	part.mesh = shape
	part.material_override = material(color, glow)
	part.position = at
	parent.add_child(part)
	return part

static func ball(parent: Node3D, size: Vector3, color: Color, at: Vector3) -> MeshInstance3D:
	var shape := SphereMesh.new()
	shape.radial_segments = 12
	shape.rings = 6
	var part := mesh(parent, shape, color, at)
	part.scale = size
	return part

static func box(parent: Node3D, size: Vector3, color: Color, at: Vector3) -> MeshInstance3D:
	var shape := BoxMesh.new()
	shape.size = size
	return mesh(parent, shape, color, at)

static func crystal(parent: Node3D, at: Vector3, size := 0.45) -> Node3D:
	var root := Node3D.new()
	root.position = at
	parent.add_child(root)
	var shape := CylinderMesh.new()
	shape.top_radius = 0.0
	shape.bottom_radius = size * 0.28
	shape.height = size
	shape.radial_segments = 5
	mesh(root, shape, Color("50f7de"), Vector3(0, size * 0.5, 0), 0.35)
	return root

static func portal(parent: Node3D, at: Vector3, angle: float) -> Node3D:
	var root := Node3D.new()
	root.position = at
	root.rotation.y = angle
	parent.add_child(root)
	var torus := TorusMesh.new()
	torus.inner_radius = 0.43
	torus.outer_radius = 0.52
	torus.rings = 16
	torus.ring_segments = 8
	var halo := mesh(root, torus, Color("ffe694"), Vector3(0, 0.8, 0), 0.7)
	halo.rotation.x = PI / 2.0
	halo.scale = Vector3(1, 1, 1.5)
	for side in [-1.0, 1.0]:
		box(root, Vector3(0.16, 1.6, 0.23), Color("7095d0"), Vector3(side * 0.58, 0.8, 0))
	box(root, Vector3(1.34, 0.18, 0.3), Color("a3c5f5"), Vector3(0, 1.64, 0))
	return root

static func rig(parent: Node3D, color: Color, equipment: Dictionary = {}) -> Dictionary:
	var root := Node3D.new()
	parent.add_child(root)
	var body := ball(root, Vector3(0.67, 0.68, 0.57), color, Vector3(0, 0.56, 0))
	ball(root, Vector3(0.48, 0.32, 0.12), Color("fff0cf"), Vector3(0, 0.56, -0.27))
	for side in [-1.0, 1.0]:
		ball(root, Vector3(0.055, 0.085, 0.045), Color("14253d"), Vector3(side * 0.10, 0.59, -0.34))
	var limbs: Array[Node3D] = []
	for side in [-1.0, 1.0]:
		limbs.append(ball(root, Vector3(0.17, 0.28, 0.18), Color("b19ae4") if equipment.get("gloves", false) else color.darkened(0.2), Vector3(side * 0.36, 0.44, 0)))
	for side in [-1.0, 1.0]:
		limbs.append(ball(root, Vector3(0.22, 0.16, 0.28), Color("425b7f") if equipment.get("boots", false) else color.darkened(0.3), Vector3(side * 0.19, 0.12, -0.015)))
	if equipment.get("pants", false):
		ball(root, Vector3(0.59, 0.22, 0.49), Color("6e8eb9"), Vector3(0, 0.30, 0))
	if equipment.get("armor", false):
		box(root, Vector3(0.48, 0.27, 0.18), Color("8bba87"), Vector3(0, 0.41, -0.23))
	if equipment.get("helmet", false):
		ball(root, Vector3(0.70, 0.30, 0.60), Color("9c8ada"), Vector3(0, 0.83, 0))
	var sword := Node3D.new()
	root.add_child(sword)
	sword.position = Vector3(0.41, 0.42, -0.08)
	box(sword, Vector3(0.07, 0.07, 0.70), Color("b0fff2"), Vector3(0, 0, -0.38))
	box(sword, Vector3(0.27, 0.08, 0.07), Color("ffcc55"), Vector3(0, 0, -0.10))
	sword.visible = equipment.get("weapon", false)
	return {"root": root, "body": body, "limbs": limbs, "sword": sword}
