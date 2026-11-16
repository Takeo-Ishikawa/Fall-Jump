class_name FallPlayer
extends CharacterBody3D

signal health_changed(value: int)
signal died
signal landed(speed: float)

const JUMP := 13.68
const GRAVITY := 34.56
var health := 100
var max_health := 100
var protection := 0.0
var protection_duration := 1.0
var cooldown := 0.0
var attack_duration := 0.0
var sword_cooldown := 0.4
var previous_position := Vector3.ZERO
var facing := Vector3.RIGHT
var rig: Dictionary
var phase := 0.0
var coyote := 0.0
var jump_buffer := 0.0
var squash := 0.0
var move_axis := Vector2.ZERO
var lock_radius := false

func _ready() -> void:
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.30
	capsule.height = 0.90
	collision.shape = capsule
	collision.position.y = 0.45
	add_child(collision)
	floor_snap_length = 0.12
	floor_max_angle = deg_to_rad(46)
	motion_mode = CharacterBody3D.MOTION_MODE_GROUNDED

func configure(save: FallSave) -> void:
	if not rig.is_empty():
		rig.root.queue_free()
	rig = FallArt.rig(self, save.color(), save.data.equipment)
	max_health = 100 + int(save.data.talents.vitality) * 10
	health = max_health
	protection_duration = 1.0 + int(save.data.talents.guard) / 6.0
	sword_cooldown = 0.4 - int(save.data.talents.agility) / 30.0
	protection = 0
	cooldown = 0

func teleport(where: Vector3) -> void:
	global_position = where + Vector3.UP * 0.04
	velocity = Vector3.ZERO
	previous_position = global_position
	move_axis = Vector2.ZERO
	jump_buffer = 0
	coyote = 0
	reset_physics_interpolation()

func request_jump() -> void:
	jump_buffer = 0.12

func tick(delta: float, axis: Vector2) -> void:
	previous_position = global_position
	protection = maxf(0, protection - delta)
	cooldown = maxf(0, cooldown - delta)
	attack_duration = maxf(0, attack_duration - delta)
	jump_buffer = maxf(0, jump_buffer - delta)
	coyote = 0.10 if is_on_floor() else maxf(0, coyote - delta)
	var angle := atan2(position.x, position.z)
	var current_radius := Vector2(position.x, position.z).length()
	var next_radius := 3.24 if lock_radius else current_radius - axis.y * 3.24 * delta
	var next_angle := angle + axis.x * 2.4 * delta
	# Follow an arc rather than a tangent Euler step, which drifts outwards each lap.
	var target_position := Vector3(sin(next_angle) * next_radius, position.y, cos(next_angle) * next_radius)
	var desired := (target_position - position) / maxf(delta, 0.001)

	var accel := 65.0 if axis.length() > 0.05 else 90.0
	velocity.x = move_toward(velocity.x, desired.x, accel * delta)
	velocity.z = move_toward(velocity.z, desired.z, accel * delta)
	if desired.length() > 0.1:
		facing = desired.normalized()
	if jump_buffer > 0 and coyote > 0:
		velocity.y = JUMP
		jump_buffer = 0
		coyote = 0
		floor_snap_length = 0.0
	else:
		floor_snap_length = 0.12
	velocity.y = maxf(velocity.y - GRAVITY * delta, -25.2)
	var was_grounded := is_on_floor()
	var landing_speed := -velocity.y
	move_and_slide()
	# Keep the same three radial lanes, with a physical tower collider inside.
	var r := Vector2(position.x, position.z).length()
	if lock_radius and r > 0.1:
		position.x *= 3.24 / r
		position.z *= 3.24 / r
	elif r > 4.74:
		position.x *= 4.74 / r
		position.z *= 4.74 / r
	if not was_grounded and is_on_floor():
		squash = minf(0.25, landing_speed * 0.012)
		landed.emit(landing_speed)
	animate(delta)

func animate(delta: float) -> void:
	if rig.is_empty():
		return
	var speed := Vector2(velocity.x, velocity.z).length()
	phase += speed * delta * 2.4
	squash = move_toward(squash, 0, delta * 2)
	var target := atan2(-facing.x, -facing.z)
	rig.root.rotation.y = lerp_angle(rig.root.rotation.y, target, 1.0 - exp(-18 * delta))
	rig.root.scale = Vector3(1 + squash, 1 - squash, 1 + squash)
	var stride := sin(phase) * minf(speed / 4.0, 1.0) if is_on_floor() else 0.0
	for i in 4:
		rig.limbs[i].rotation.x = stride * (1 if i % 2 == 0 else -1) * 0.6
		rig.limbs[i].position.y = (0.44 if i < 2 else 0.12) + (maxf(0, stride * (1 if i % 2 else -1)) * 0.09 if i >= 2 else 0.0)
	rig.sword.rotation.y = -1.1 + (1.0 - attack_duration / 0.18) * 2.2 if attack_duration > 0 else -0.3
	rig.root.visible = protection <= 0 or int(protection * 14) % 2 == 0

func hurt(amount: int) -> bool:
	if protection > 0 or health <= 0:
		return false
	health = maxi(0, health - amount)
	protection = protection_duration
	health_changed.emit(health)
	if health == 0:
		died.emit()
	return true

func attack() -> bool:
	if cooldown > 0 or rig.is_empty() or not rig.sword.visible:
		return false
	cooldown = sword_cooldown
	attack_duration = 0.18
	return true
