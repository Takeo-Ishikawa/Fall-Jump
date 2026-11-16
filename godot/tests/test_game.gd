extends SceneTree

var failures := 0
var checks := 0
var game: Node3D

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, message: String) -> void:
	checks += 1
	if not condition:
		failures += 1
		push_error(message)

func frames(count: int) -> void:
	for i in count:
		await physics_frame

func run() -> void:
	var state := FallSave.new()
	state.path = "user://test-progress.json"
	for suffix in ["", ".bak", ".tmp"]:
		if FileAccess.file_exists(state.path + suffix):
			DirAccess.remove_absolute(state.path + suffix)
	state.normalize({"coins": 300, "unlocked": 2, "selected": 99, "equipment": {"weapon": true}, "talents": {"vitality": 99}, "owned": ["strawberry"], "skin": "strawberry"})
	check(state.data.selected == 2 and state.data.talents.vitality == 3, "save bounds")
	check(state.save_game(), "atomic save succeeds")
	var reloaded := FallSave.new()
	reloaded.path = state.path
	reloaded.load_game()
	check(reloaded.data == state.data, "save roundtrip preserves equipment, progress and cosmetics")
	check(state.upgrade("agility") and state.data.coins == 270 and state.data.talents.agility == 1, "talents charge once")
	check(not state.upgrade("invalid"), "unknown talent rejected")
	check(state.choose_skin("lemon") and state.data.coins == 210, "skin purchase")
	check(state.choose_skin("lemon") and state.data.coins == 210, "owned cosmetic is not charged twice")
	state.record(1, 11, true)
	check(not state.data.completed.has("1"), "partial run never completes phase")
	state.record(1, 12, true)
	check(state.data.completed.get("1", false), "12-area completion")
	var f := FileAccess.open(state.path, FileAccess.WRITE)
	f.store_string("broken")
	f.close()
	reloaded.load_game()
	check(reloaded.data.skin == "lemon", "corrupt save recovers backup")

	var geo := FallChunk.wedge(1.62, 2.7, FallCourse.STEP, 0.54)
	check(geo.mesh.surface_get_arrays(0)[Mesh.ARRAY_NORMAL][0].y > 0.99, "top normals face upward for mobile lighting")
	var source := FallCourse.new()
	check(source.generate(1).size() == 12, "authored first phase")
	for n in [2, 3, 6, 15, 999]:
		var areas := source.generate(n, 123)
		check(areas.size() == FallSave.count(n), "native circular stage length %d" % n)
		check(JSON.stringify(areas) == JSON.stringify(source.generate(n, 123)), "seeded stage %d" % n)
		for a in areas.slice(0, 3):
			check(not a.tiles.any(func(t): return t.get("danger", false)), "safe opening")
	var input := FallTouch.new()
	root.add_child(input)
	input.touch(0, Vector2(100, 500), true)
	check(not input.active, "joystick remains hidden on a tap")
	input.drag(0, Vector2(150, 500))
	check(input.active and input.axis.x > 0.5, "drag activates proportional stick")
	var jumps := [0]
	input.jumped.connect(func(): jumps[0] += 1)
	input.touch(1, Vector2(350, 500), true)
	input.touch(1, Vector2(350, 500), false)
	input.drag(0, Vector2(155, 500))
	input.clock += 0.15
	input.touch(1, Vector2(350, 500), true)
	input.touch(1, Vector2(350, 500), false)
	check(jumps[0] == 1 and input.active, "second finger double tap jumps while stick moves")
	input.reset()
	check(not input.active and input.axis == Vector2.ZERO, "release/cancel clears stick")
	input.queue_free()

	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	await frames(2)
	# Isolate test state; never read or overwrite the player's real save.
	game.save = FallSave.new()
	game.save.path = "user://test-run.json"
	game.save.data.equipment.weapon = true
	game.start_stage(1)
	await frames(8)
	check(game.player.is_on_floor() and game.player.health == 100, "spawns grounded with 100 HP")
	var original_y: float = game.player.position.y
	game.player.request_jump()
	await frames(15)
	check(game.player.position.y > original_y + 1, "manual jump uses native physics")
	await frames(55)
	check(game.player.is_on_floor(), "jump returns to platform without automatic bounce")
	game.pause_game()
	var stopped: Vector3 = game.player.position
	await frames(20)
	check(game.player.position == stopped and game.mode == "paused", "pause freezes physics")
	game.resume_game()

	# Optional coin rewards persist through an area respawn.
	game.player.teleport(FallCourse.point(2, 3.5))
	await frames(10)
	check(game.save.data.coins == 2, "optional coin awards two")
	game.fall_back()
	await frames(3)
	game.player.teleport(FallCourse.point(2, 3.5))
	await frames(10)
	check(game.save.data.coins == 2, "respawn does not farm coins")
	check(game.player.health == 90, "fall costs ten HP")

	# Native fragile floor disappears after 0.75 seconds, and pause freezes its timer.
	game.index = 4
	game.load_nearby()
	game.place_player()
	game.player.teleport(FallCourse.point(1, 4.5, game.areas[4].angle, game.areas[4].y))
	await frames(8)
	var bridge: StaticBody3D
	for surface in game.chunks[4].surfaces:
		var tile: Dictionary = surface.get_meta("tile")
		if tile.lane == 1 and tile.cell == 4:
			bridge = surface
	check(bridge != null and game.player.is_on_floor(), "native fragile bridge supports player")
	var held_time: float = bridge.get_meta("standing")
	game.pause_game()
	await frames(20)
	check(bridge.get_meta("standing") == held_time, "pause freezes bridge collapse")
	game.resume_game()
	await frames(45)
	check(bridge.get_meta("collision").disabled, "fragile bridge disables native collider")

	# Test patrol contact, protection, three stomps and directional sword damage.
	game.index = 8
	game.load_nearby()
	game.place_player()
	await frames(5)
	var enemy: FallEnemy = game.chunks[8].enemy
	game.player.protection = 0
	game.player.teleport(enemy.global_position)
	await frames(3)
	check(game.player.health == 85, "enemy contact costs five HP once during protection")
	for hit in 3:
		game.player.teleport(enemy.global_position + Vector3.UP * 1.35)
		game.player.velocity.y = -6
		var before_hp := enemy.hp
		for frame in 30:
			await frames(1)
			if enemy.hp < before_hp:
				break
		check(enemy.hp == 2 - hit and game.player.velocity.y > 0, "stomp %d bounces and damages once" % (hit + 1))
	check(not enemy.visible, "third stomp defeats patrol")
	game.index = 10
	game.load_nearby()
	game.place_player()
	await frames(2)
	enemy = game.chunks[10].enemy
	game.player.teleport(enemy.global_position + Vector3.RIGHT)
	game.player.facing = Vector3.RIGHT
	game.player.cooldown = 0
	game.attack()
	check(enemy.hp == 3, "sword does not hit behind player")
	game.player.facing = Vector3.LEFT
	game.player.cooldown = 0
	game.attack()
	check(enemy.hp == 2, "sword hits in facing direction")
	game.attack()
	check(enemy.hp == 2, "sword cooldown prevents repeated damage")
	game.player.protection = 0
	game.player.hurt(100)
	check(game.mode == "result", "zero HP ends run once")

	# Traverse all twelve areas via the actual CharacterBody3D controller.
	game.save.data = FallSave.defaults()
	game.start_stage(1)
	await frames(8)
	for a in 12:
		var area: Dictionary = game.areas[a]
		var path := route(area)
		check(not path.is_empty(), "area %d has a route" % (a + 1))
		for target in path.slice(1):
			game.player.request_jump()
			var reached := false
			for frame in 160:
				if game.index != a or game.mode != "playing":
					reached = true
					break
				var pos: Vector3 = game.player.position
				var angle_error := angle_difference(atan2(pos.x, pos.z), float(area.angle) + (float(target.cell) + 0.5) * FallCourse.STEP)
				var radius_error := FallCourse.radius(int(target.lane)) - Vector2(pos.x, pos.z).length()
				game.ui.touch.axis = Vector2(clampf(angle_error / 0.1, -1, 1), -clampf(radius_error / 0.18, -1, 1)).limit_length()
				await frames(1)
				if frame > 6 and game.player.is_on_floor() and absf(angle_error) < 0.06 and absf(radius_error) < 0.13:
					reached = true
					break
			check(reached, "native route area %d tile %s" % [a + 1, str(target)])
			if not reached:
				print("Route failed at ", game.player.position, " health ", game.player.health)
				break
			if game.index != a or game.mode != "playing":
				break
		game.ui.touch.axis = Vector2.ZERO
		await frames(20)
		check(game.index == a + 1, "portal advances area %d" % (a + 1))
		if game.index != a + 1:
			break
		check(game.chunks.size() <= 5, "chunk streaming is bounded")
		check(game.chunks.values().all(func(chunk): return chunk.draw_batches <= 8), "platform draws stay batched")
	check(game.mode == "result" and game.save.data.unlocked == 2, "complete 3D run unlocks next phase")
	var carried: int = game.player.health
	game.start_stage(2)
	check(game.player.health == carried, "next phase preserves remaining health")
	await frames(8)
	game.ui.touch.axis = Vector2(-0.5, 0)
	await frames(100)
	check(absf(Vector2(game.player.position.x, game.player.position.z).length() - 3.24) < 0.03, "circular walking keeps radius without outward drift")
	print("GODOT CHECKS: ", checks, "  FAILURES: ", failures)
	game.queue_free()
	await process_frame
	FallArt.materials.clear()
	FallChunk.geometry.clear()
	quit(1 if failures > 0 else 0)

func route(area: Dictionary) -> Array:
	var tiles: Array = area.tiles
	var start: Dictionary = tiles.filter(func(t): return t.lane == 1 and t.cell == 0)[0]
	var queue: Array = [start]
	var parents := {"1:0": {}}
	var found: Dictionary = {}
	for a in queue:
		if a.get("exit", false):
			found = a
			break
		for b in tiles:
			var key := "%d:%d" % [b.lane, b.cell]
			if parents.has(key) or b.height - a.height > 40:
				continue
			var pa := FallCourse.point(int(a.lane), float(a.cell) + 0.5)
			var pb := FallCourse.point(int(b.lane), float(b.cell) + 0.5)
			if pa.distance_to(pb) <= 2.70:
				parents[key] = a
				queue.append(b)
	var result: Array = []
	while not found.is_empty():
		result.push_front(found)
		found = parents["%d:%d" % [found.lane, found.cell]]
	return result
