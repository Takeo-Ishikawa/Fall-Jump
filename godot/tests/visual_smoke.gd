extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func capture(name: String) -> void:
	await RenderingServer.frame_post_draw
	var args := OS.get_cmdline_user_args()
	var folder := args[0] if not args.is_empty() else "/tmp"
	root.get_texture().get_image().save_png(folder.path_join(name + ".png"))

func run() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() >= 3:
		root.size = Vector2i(int(args[1]), int(args[2]))
	var game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	await process_frame
	await capture("godot-world")
	game.ui.show_page("equipment")
	await capture("godot-equipment")
	game.save.path = "user://visual-smoke.json"
	game.save.data.equipment.weapon = true
	game.start_stage(1)
	for i in 12:
		await physics_frame
	await capture("godot-play")
	game.index = 6
	game.load_nearby()
	game.place_player()
	for i in 10:
		await physics_frame
	await capture("godot-zigzag")
	game.pause_game()
	await capture("godot-pause")
	game.queue_free()
	await process_frame
	FallArt.materials.clear()
	FallChunk.geometry.clear()
	quit()
