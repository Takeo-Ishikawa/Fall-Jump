class_name FallEnemy
extends Node3D

var hp := 3
var angle := 0.0
var direction := 1.0
var min_angle := 0.0
var max_angle := 0.0
var patrol_radius := 3.24
var flash := 0.0
var body: MeshInstance3D
var pips: Array[MeshInstance3D] = []

func setup(patrol: Dictionary) -> void:
	min_angle = (float(patrol.from) + 0.4) * FallCourse.STEP
	max_angle = (float(patrol.to) + 0.6) * FallCourse.STEP
	angle = (min_angle + max_angle) * 0.5
	patrol_radius = FallCourse.radius(int(patrol.lane))
	body = FallArt.ball(self, Vector3(0.64, 0.55, 0.54), Color("d95487"), Vector3(0, 0.35, 0))
	for side in [-1.0, 1.0]:
		FallArt.ball(self, Vector3(0.16, 0.22, 0.10), Color("fff1d1"), Vector3(side * 0.13, 0.40, -0.25))
		FallArt.ball(self, Vector3(0.06, 0.09, 0.04), Color("35213c"), Vector3(side * 0.13, 0.40, -0.31))
		var horn := FallArt.crystal(self, Vector3(side * 0.20, 0.53, 0), 0.28)
		horn.get_child(0).material_override = FallArt.material(Color("77274b"))
	for i in 3:
		pips.append(FallArt.ball(self, Vector3.ONE * 0.09, Color("ffe1b2"), Vector3((i - 1) * 0.16, 0.97, 0)))
	tick(0)

func tick(delta: float) -> void:
	if hp <= 0:
		return
	angle += direction * delta * 0.36
	if angle > max_angle or angle < min_angle:
		angle = clampf(angle, min_angle, max_angle)
		direction *= -1.0
	position = Vector3(sin(angle) * patrol_radius, 0, cos(angle) * patrol_radius)
	rotation.y = angle + direction * PI / 2.0
	flash = maxf(0, flash - delta)
	body.scale.y = 0.55 + sin(angle * 12.0) * 0.025
	body.material_override = FallArt.material(Color("ffe5bd") if flash > 0 else Color("d95487"))

func hit() -> bool:
	if hp <= 0:
		return false
	hp -= 1
	flash = 0.15
	pips[hp].visible = false
	if hp == 0:
		visible = false
	return true
