extends Node3D

const PLAYER := preload("res://scripts/player.gd")
const CHUNK := preload("res://scripts/chunk.gd")
const UI := preload("res://scripts/interface.gd")
var save := FallSave.new()
var course := FallCourse.new()
var player: FallPlayer
var ui: FallInterface
var camera: Camera3D
var chunks: Dictionary = {}
var collected: Dictionary = {}
var areas: Array = []
var mode := "menu"
var stage := 1
var index := 0
var score := 0
var run_coins := 0
var fever := 0.0
var charge := 0
var notice_text := ""
var notice_time := 0.0
var transition_pending := false
var camera_angle := 0.0
var camera_height := 0.0
var camera_reset := true
var ambience_time := 0.0
var effects: Array[Node3D] = []
var sound_cache: Dictionary = {}
var audio: AudioStreamPlayer

func _ready() -> void:
	save.load_game()
	build_environment()
	player = PLAYER.new()
	add_child(player)
	player.health_changed.connect(func(_value): ui.update_hud())
	player.died.connect(func(): finish(false))
	player.landed.connect(func(speed):
		if fever <= 0:
			charge = 0
		if speed > 8:
			burst(player.position, Color("5dffd0"), 4))
	ui = UI.new()
	ui.game = self
	add_child(ui)
	audio = AudioStreamPlayer.new()
	audio.volume_db = -18
	add_child(audio)
	stage = save.data.selected
	areas = course.generate(stage)
	load_nearby()
	player.configure(save)
	player.lock_radius = stage > 1
	place_player()
	ui.show_page("world")
	get_tree().auto_accept_quit = false

func build_environment() -> void:
	var world := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("122740")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("9dc8ed")
	env.ambient_light_energy = 0.4
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	world.environment = env
	add_child(world)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -35, 0)
	sun.light_color = Color("fff2d5")
	sun.light_energy = 0.85
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 35
	add_child(sun)
	camera = Camera3D.new()
	# This camera follows the interpolated player every rendered frame.
	# Disable its own physics interpolation to avoid interpolating the result twice.
	camera.physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_OFF
	camera.fov = 55
	camera.near = 0.1
	camera.far = 80
	add_child(camera)
	camera.current = true
	# A short tower segment follows the active area instead of using a 2,400 m collider.
	var tower := StaticBody3D.new()
	tower.name = "Tower"
	add_child(tower)
	var cylinder := CylinderMesh.new()
	cylinder.top_radius = 1.29
	cylinder.bottom_radius = 1.29
	cylinder.height = 55
	cylinder.radial_segments = 24
	FallArt.mesh(tower, cylinder, Color("294d70"))
	var shape := CylinderShape3D.new()
	shape.radius = 1.29
	shape.height = 55
	var collision := CollisionShape3D.new()
	collision.shape = shape
	tower.add_child(collision)
	for i in 13:
		var torus := TorusMesh.new()
		torus.inner_radius = 1.285
		torus.outer_radius = 1.32
		torus.rings = 24
		torus.ring_segments = 4
		FallArt.mesh(tower, torus, Color("456b8f"), Vector3(0, (i - 6) * 4, 0))
	var rng := RandomNumberGenerator.new()
	rng.seed = 32019
	for i in 12:
		var island := Node3D.new()
		island.name = "Distant%d" % i
		add_child(island)
		var angle := i * TAU / 12.0
		island.position = Vector3(sin(angle) * rng.randf_range(14, 23), rng.randf_range(-20, 15), cos(angle) * rng.randf_range(14, 23))
		var rock := CylinderMesh.new()
		rock.top_radius = rng.randf_range(1, 2)
		rock.bottom_radius = 0
		rock.height = 2
		rock.radial_segments = 5
		FallArt.mesh(island, rock, Color("244c64"))
		FallArt.crystal(island, Vector3.UP, 1.4)

func start_stage(number: int) -> void:
	if number < 1 or number > save.data.unlocked:
		return
	var carried_health := player.health if mode == "result" and player.health > 0 and number == stage + 1 else -1
	stage = number
	save.data.selected = stage
	save.save_game()
	for chunk in chunks.values():
		remove_child(chunk)
		chunk.queue_free()
	chunks.clear()
	for fx in effects:
		fx.queue_free()
	effects.clear()
	collected.clear()
	areas = course.generate(stage, randi())
	index = 0
	score = 0
	run_coins = 0
	fever = 0
	charge = 0
	transition_pending = false
	load_nearby()
	player.configure(save)
	player.lock_radius = stage > 1
	if carried_health >= 0:
		player.health = mini(player.max_health, carried_health)
	place_player()
	mode = "playing"
	ui.playing()
	show_tip(areas[0].tip, 8)

func load_nearby() -> void:
	for key in chunks.keys():
		if int(key) < index - 1 or int(key) > index + 3:
			remove_child(chunks[key])
			chunks[key].queue_free()
			chunks.erase(key)
	for i in range(maxi(0, index - 1), mini(areas.size(), index + 4)):
		if not chunks.has(i):
			var chunk := CHUNK.new()
			add_child(chunk)
			chunk.build(areas[i], collected)
			chunk.reset_physics_interpolation()
			chunk.portal_entered.connect(request_advance)
			chunk.coin_collected.connect(collect_coin)
			chunks[i] = chunk
	get_node("Tower").position.y = -index * FallCourse.SPACING

func place_player() -> void:
	var area: Dictionary = areas[mini(index, areas.size() - 1)]
	player.teleport(FallCourse.point(int(area.entry.lane), float(area.entry.cell) + 0.5, float(area.angle), float(area.y)))
	player.facing = Vector3(sin(float(area.angle) + 0.13), 0, cos(float(area.angle) + 0.13))
	camera_angle = atan2(player.position.x, player.position.z)
	camera_height = player.position.y
	camera_reset = true
	if is_instance_valid(ui):
		ui.touch.reset()

func request_advance(area_index: int) -> void:
	if mode != "playing" or transition_pending or area_index != index:
		return
	transition_pending = true
	call_deferred("advance", true)

func advance(portal: bool) -> void:
	if mode != "playing":
		transition_pending = false
		return
	score += (2 if areas[index].get("special", "") == "bonus" else 1) * (2 if fever > 0 else 1)
	index += 1
	if index % 4 == 0:
		earn(2)
	save.record(stage, index)
	if index == areas.size():
		earn(12)
		save.record(stage, index, true)
		finish(true)
		return
	if not portal and fever <= 0 and areas[index - 1].get("special", "") != "fragile":
		charge += 1
		if charge >= 5:
			fever = 1.5
			charge = 0
	load_nearby()
	if portal:
		place_player()
		show_tip(areas[index].tip)
	transition_pending = false
	ui.update_hud()
	sound(660)

func collect_coin(key: String, where: Vector3) -> void:
	if collected.has(key) or mode != "playing":
		return
	collected[key] = true
	earn(2)
	burst(where, Color("ffda5b"), 8)
	sound(880)

func earn(amount: int) -> void:
	save.earn(amount)
	run_coins += amount
	ui.update_hud()

func _physics_process(delta: float) -> void:
	if mode != "playing":
		return
	notice_time = maxf(0, notice_time - delta)
	fever = maxf(0, fever - delta)
	var axis := ui.touch.axis
	if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT):
		axis.x -= 1
	if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT):
		axis.x += 1
	if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP):
		axis.y -= 1
	if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN):
		axis.y += 1
	axis = axis.limit_length()
	# Circular stages keep their single radial track.
	if stage > 1:
		axis.y = 0
	player.tick(delta, axis)
	for chunk in chunks.values():
		chunk.update_visuals(delta, player)
	if transition_pending or mode != "playing":
		return
	for i in player.get_slide_collision_count():
		var collision := player.get_slide_collision(i)
		var floor_body := collision.get_collider() as StaticBody3D
		if floor_body == null or not floor_body.is_in_group("floor") or collision.get_normal().y < 0.65:
			continue
		var floor_index: int = floor_body.get_meta("area")
		if chunks.has(floor_index):
			var chunk: FallChunk = chunks[floor_index]
			if chunk.stand_on(floor_body, delta):
				finish(false)
				return
			if stage > 1 and fever > 0:
				chunk.smash()
	combat()
	if stage == 1 and player.position.y < float(areas[index].y) - 2.4:
		fall_back()
	elif stage > 1 and player.position.y < float(areas[index].y) - 0.3 and not transition_pending:
		transition_pending = true
		call_deferred("advance", false)
	ui.update_hud()

func combat() -> void:
	if not chunks.has(index):
		return
	var enemy = chunks[index].enemy
	if not is_instance_valid(enemy) or enemy.hp <= 0:
		return
	var difference: Vector3 = player.position - enemy.global_position
	if Vector2(difference.x, difference.z).length() > 0.65:
		return
	var head: float = enemy.global_position.y + 0.78
	if player.velocity.y < 0 and player.previous_position.y >= head - 0.08 and player.position.y <= head:
		enemy.hit()
		player.position.y = head + 0.02
		player.velocity.y = FallPlayer.JUMP
		player.squash = 0.16
		burst(enemy.global_position + Vector3.UP * 0.6, Color("ffdf82"), 6)
		sound(540 if enemy.hp > 0 else 760)
	elif difference.y < 0.65 and difference.y > -0.4:
		player.hurt(5)

func attack() -> void:
	if mode != "playing" or not player.attack():
		return
	sound(330)
	burst(player.position + player.facing * 0.65 + Vector3.UP * 0.5, Color("b9fff3"), 5)
	if chunks.has(index):
		var enemy = chunks[index].enemy
		if is_instance_valid(enemy) and enemy.hp > 0:
			var difference: Vector3 = enemy.global_position - player.position
			if difference.length() < 1.56 and Vector3(difference.x, 0, difference.z).dot(player.facing) > -0.06:
				enemy.hit()

func fall_back() -> void:
	player.hurt(10)
	if mode != "playing":
		return
	var old: FallChunk = chunks[index]
	remove_child(old)
	old.queue_free()
	chunks.erase(index)
	load_nearby()
	place_player()
	charge = 0
	show_tip("De volta à entrada. Use o salto para atravessar os vãos.")

func pause_game() -> void:
	if mode == "playing":
		mode = "paused"
		ui.pause_screen()

func resume_game() -> void:
	mode = "playing"
	ui.playing()

func go_home() -> void:
	mode = "menu"
	save.save_game()
	ui.show_page("world")

func finish(win: bool) -> void:
	if mode != "playing":
		return
	mode = "result"
	transition_pending = false
	save.record(stage, index, win)
	ui.results(win)
	sound(880 if win else 160)

func show_tip(text: String, seconds := 5.0) -> void:
	notice_text = text
	notice_time = seconds

func _unhandled_key_input(event: InputEvent) -> void:
	if not event.is_pressed() or event.is_echo():
		return
	if event.keycode == KEY_ESCAPE:
		if mode == "playing":
			pause_game()
		elif mode == "paused":
			resume_game()
	elif mode == "playing":
		if event.keycode == KEY_SPACE:
			player.request_jump()
		elif event.keycode == KEY_J:
			attack()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		pause_game()
	elif what == NOTIFICATION_WM_GO_BACK_REQUEST:
		if mode == "playing":
			pause_game()
		elif mode == "paused":
			resume_game()
		elif mode == "menu":
			ui.show_page("world")
	elif what == NOTIFICATION_WM_CLOSE_REQUEST:
		save.save_game()
		get_tree().quit()

func _process(delta: float) -> void:
	if not is_instance_valid(player):
		return
	var target := player.get_global_transform_interpolated().origin
	var angle := atan2(target.x, target.z)
	if mode == "playing" or camera_reset:
		camera_angle = lerp_angle(camera_angle, angle, 1.0 - exp(-9.0 * delta))
		camera_height = lerpf(camera_height, target.y, 1.0 - exp(-10.0 * delta))
		var distance := Vector2(target.x, target.z).length() + 10.5
		var camera_target := Vector3(sin(camera_angle) * distance, camera_height + 8.3, cos(camera_angle) * distance)
		camera.position = camera_target
		camera.look_at(Vector3(target.x, camera_height + 0.6, target.z))
		camera_reset = false
	if mode == "playing":
		ambience_time += delta
		for fx in effects.duplicate():
			var life: float = fx.get_meta("life") - delta
			fx.set_meta("life", life)
			fx.position += fx.get_meta("velocity") * delta
			fx.scale = Vector3.ONE * maxf(0.01, life * 2.0)
			if life <= 0:
				effects.erase(fx)
				fx.queue_free()

func burst(where: Vector3, color: Color, count: int) -> void:
	if effects.size() >= 40:
		return
	for i in mini(count, 40 - effects.size()):
		var fx := FallArt.ball(self, Vector3.ONE * 0.10, color, where)
		fx.physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_OFF
		fx.set_meta("life", 0.45)
		fx.set_meta("velocity", Vector3(randf_range(-1.8, 1.8), randf_range(0.5, 2), randf_range(-1.8, 1.8)))
		effects.append(fx)

func sound(frequency: int) -> void:
	if not is_instance_valid(audio) or DisplayServer.get_name() == "headless":
		return
	if not sound_cache.has(frequency):
		var bytes := PackedByteArray()
		var length := 4410
		bytes.resize(length * 2)
		for i in length:
			var sample := sin(TAU * frequency * i / 44100.0) * (1.0 - float(i) / length) * 12000
			bytes.encode_s16(i * 2, int(sample))
		var stream := AudioStreamWAV.new()
		stream.format = AudioStreamWAV.FORMAT_16_BITS
		stream.mix_rate = 44100
		stream.data = bytes
		sound_cache[frequency] = stream
	audio.stream = sound_cache[frequency]
	audio.play()

func _exit_tree() -> void:
	if is_instance_valid(audio):
		audio.stop()
		audio.stream = null
	sound_cache.clear()
