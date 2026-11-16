class_name FallInterface
extends CanvasLayer

var game: Node3D
var root: Control
var menu_root: Control
var content: VBoxContainer
var hud: VBoxContainer
var touch: FallTouch
var nav: HBoxContainer
var page := "world"
var stage_page := 0
var title: Label
var hp: ProgressBar
var progress: Label
var wallet: Label
var attack_button: Button
var notice: Label
var preview: Node3D
var screen_rect := Rect2i()
var main_margin: MarginContainer
var action_row: HBoxContainer

func _ready() -> void:
	root = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	var theme := Theme.new()
	theme.default_font_size = 19
	for state in ["normal", "hover", "pressed", "focus", "disabled"]:
		var style := StyleBoxFlat.new()
		style.bg_color = Color("25445f") if state != "pressed" else Color("357d7c")
		if state == "disabled":
			style.bg_color = Color("1b3049")
		style.border_color = Color("47738d")
		style.set_border_width_all(1)
		style.set_corner_radius_all(14)
		style.content_margin_left = 16
		style.content_margin_right = 16
		style.content_margin_top = 14
		style.content_margin_bottom = 14
		theme.set_stylebox(state, "Button", style)
	theme.set_color("font_color", "Button", Color("eaf7ff"))
	theme.set_color("font_disabled_color", "Button", Color("8aa4c3"))
	theme.set_color("font_color", "Label", Color("e4f1ff"))
	root.theme = theme
	touch = FallTouch.new()
	root.add_child(touch)
	touch.jumped.connect(func(): game.player.request_jump())
	make_hud()
	var map := FallMinimap.new()
	map.game = game
	root.add_child(map)
	map.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	map.offset_left = -150
	map.offset_right = -22
	map.offset_top = 112
	map.offset_bottom = 240
	menu_root = Control.new()
	menu_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(menu_root)
	var shade := ColorRect.new()
	shade.color = Color(0.025, 0.065, 0.14, 0.88)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	menu_root.add_child(shade)
	var margin := MarginContainer.new()
	main_margin = margin
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 24)
	margin.add_theme_constant_override("margin_right", 24)
	margin.add_theme_constant_override("margin_top", 35)
	margin.add_theme_constant_override("margin_bottom", 120)
	menu_root.add_child(margin)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	margin.add_child(scroll)
	content = VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 15)
	scroll.add_child(content)
	nav = HBoxContainer.new()
	nav.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	nav.offset_top = -104
	nav.offset_left = 14
	nav.offset_right = -14
	nav.offset_bottom = -14
	menu_root.add_child(nav)
	for entry in [["Equipar", "equipment"], ["Mundo", "world"], ["Talentos", "talents"], ["Loja", "shop"]]:
		var button := Button.new()
		button.text = entry[0]
		button.add_theme_font_size_override("font_size", 16)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.pressed.connect(show_page.bind(entry[1]))
		nav.add_child(button)

func make_hud() -> void:
	hud = VBoxContainer.new()
	hud.position = Vector2(20, 25)
	hud.custom_minimum_size.x = 315
	hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(hud)
	title = label(hud, "RUÍNAS CELESTES", 20)
	hp = ProgressBar.new()
	hp.custom_minimum_size = Vector2(250, 16)
	hp.show_percentage = false
	var health_back := StyleBoxFlat.new()
	health_back.bg_color = Color("25415a")
	health_back.set_corner_radius_all(6)
	hp.add_theme_stylebox_override("background", health_back)
	var health_fill := StyleBoxFlat.new()
	health_fill.bg_color = Color("48e2b1")
	health_fill.set_corner_radius_all(6)
	hp.add_theme_stylebox_override("fill", health_fill)
	hud.add_child(hp)
	progress = label(hud, "", 17)
	wallet = label(hud, "", 16)
	var pause := Button.new()
	pause.text = "Ⅱ"
	pause.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	pause.offset_left = -98
	pause.offset_right = -22
	pause.offset_top = 22
	pause.offset_bottom = 98
	pause.pressed.connect(func(): game.pause_game())
	root.add_child(pause)
	var attack_row := HBoxContainer.new()
	action_row = attack_row
	attack_row.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	attack_row.offset_left = -250
	attack_row.offset_top = -106
	attack_row.offset_right = -22
	attack_row.offset_bottom = -24
	root.add_child(attack_row)
	var jump := Button.new()
	jump.text = "Saltar"
	jump.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	jump.pressed.connect(func(): game.player.request_jump())
	attack_row.add_child(jump)
	attack_button = Button.new()
	attack_button.text = "Golpear"
	attack_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	attack_button.pressed.connect(func(): game.attack())
	attack_row.add_child(attack_button)
	notice = Label.new()
	notice.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	notice.offset_left = 28
	notice.offset_right = -28
	notice.offset_top = -224
	notice.offset_bottom = -120
	notice.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	notice.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	notice.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	notice.add_theme_color_override("font_shadow_color", Color("0c182c"))
	notice.add_theme_constant_override("shadow_outline_size", 5)
	root.add_child(notice)

func label(parent: Node, text: String, font_size := 22) -> Label:
	var node := Label.new()
	node.text = text
	node.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	node.add_theme_font_size_override("font_size", font_size)
	parent.add_child(node)
	return node

func button(parent: Node, text: String, action: Callable) -> Button:
	var node := Button.new()
	node.text = text
	node.custom_minimum_size.y = 76
	node.pressed.connect(action)
	parent.add_child(node)
	return node

func clear_content() -> void:
	preview = null
	for child in content.get_children():
		content.remove_child(child)
		child.queue_free()

func show_page(next: String) -> void:
	page = next
	game.mode = "menu"
	touch.reset()
	touch.hide()
	hud.hide()
	menu_root.show()
	nav.show()
	clear_content()
	label(content, "FALL JUMP  /  3D", 17).modulate = Color("7cf4d0")
	label(content, "%d moedas" % game.save.data.coins, 19).modulate = Color("ffdb72")
	match page:
		"world": world_page()
		"equipment": equipment_page()
		"talents": talent_page()
		"shop": shop_page()

func world_page() -> void:
	var stage: int = game.save.data.selected
	label(content, "FASE %02d" % stage, 18).modulate = Color("7cf4d0")
	label(content, "Ruínas Celestes" if stage == 1 else "Torre %d" % stage, 36)
	make_preview(false)
	var best := int(game.save.data.best.get(str(stage), 0))
	label(content, "Melhor avanço · %d / %d" % [best, FallSave.count(stage)], 21)
	var track := ProgressBar.new()
	track.max_value = FallSave.count(stage)
	track.value = best
	track.show_percentage = false
	track.custom_minimum_size.y = 12
	content.add_child(track)
	var play := button(content, "Jogar fase %d" % stage, func(): game.start_stage(stage))
	var gold: StyleBoxFlat = play.get_theme_stylebox("normal").duplicate()
	gold.bg_color = Color("ffce59")
	gold.border_color = Color("ffe8a0")
	play.add_theme_stylebox_override("normal", gold)
	play.add_theme_color_override("font_color", Color("392810"))
	label(content, "Escolha uma fase", 21)
	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	content.add_child(grid)
	stage_page = floori((stage - 1) / 6.0) if stage < stage_page * 6 + 1 or stage > stage_page * 6 + 6 else stage_page
	for i in 6:
		var n := stage_page * 6 + i + 1
		if n > 999:
			break
		var unlocked: bool = n <= game.save.data.unlocked
		var caption := "%02d\n%s" % [n, "%d/%d" % [int(game.save.data.best.get(str(n), 0)), FallSave.count(n)] if unlocked else "Bloqueada"]
		var choice := button(grid, caption, func():
			game.save.data.selected = n
			game.save.save_game()
			show_page("world"))
		choice.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		choice.disabled = not unlocked
		if n == stage:
			choice.modulate = Color("7cf4d0")
	var pages := HBoxContainer.new()
	content.add_child(pages)
	button(pages, "‹", func():
		stage_page = maxi(0, stage_page - 1)
		# A page change does not select a locked phase.
		refresh_stage_page())
	label(pages, "%d fase(s) liberada(s)" % game.save.data.unlocked, 16).size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var next := button(pages, "›", func():
		stage_page += 1
		refresh_stage_page())
	next.disabled = (stage_page + 1) * 6 >= mini(999, game.save.data.unlocked + 6)
	button(content, "Como jogar", func(): show_help())

func refresh_stage_page() -> void:
	# Keep the selected phase while listing other pages.
	clear_content()
	label(content, "ESCOLHA UMA FASE", 28)
	var row := HBoxContainer.new()
	content.add_child(row)
	button(row, "‹", func():
		stage_page = maxi(0, stage_page - 1)
		refresh_stage_page()).disabled = stage_page == 0
	label(row, "%d–%d" % [stage_page * 6 + 1, mini(999, stage_page * 6 + 6)], 22)
	button(row, "›", func():
		stage_page += 1
		refresh_stage_page()).disabled = (stage_page + 1) * 6 >= mini(999, game.save.data.unlocked + 6)
	for i in 6:
		var n := stage_page * 6 + i + 1
		if n > 999:
			break
		button(content, "Fase %d" % n, func():
			game.save.data.selected = n
			game.save.save_game()
			show_page("world")).disabled = n > game.save.data.unlocked

func make_preview(hero: bool) -> void:
	var container := SubViewportContainer.new()
	container.stretch = true
	container.custom_minimum_size = Vector2(0, 205 if hero else 175)
	container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content.add_child(container)
	var viewport := SubViewport.new()
	viewport.size = Vector2i(480, 205 if hero else 175)
	viewport.own_world_3d = true
	viewport.transparent_bg = true
	container.add_child(viewport)
	preview = Node3D.new()
	preview.physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_OFF
	viewport.add_child(preview)
	if hero:
		FallArt.rig(preview, game.save.color(), game.save.data.equipment)
	else:
		FallArt.box(preview, Vector3(3.0, 0.4, 2.2), Color("5c83c0"), Vector3(0, -0.2, 0))
		FallArt.portal(preview, Vector3(0, 0, -0.4), 0)
		FallArt.crystal(preview, Vector3(-1.0, 0, 0), 0.85)
		FallArt.crystal(preview, Vector3(1.1, 0, 0.25), 0.65)
	var camera := Camera3D.new()
	viewport.add_child(camera)
	camera.position = Vector3(0, 1.05, -2.4) if hero else Vector3(3.4, 3, -5)
	camera.look_at(Vector3(0, 0.5 if hero else 0.3, 0))
	camera.current = true
	camera.fov = 42
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-40, -30, 0)
	light.light_energy = 1.4
	viewport.add_child(light)
	var environment := WorldEnvironment.new()
	var env := Environment.new()
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("abcff1")
	env.ambient_light_energy = 0.65
	environment.environment = env
	viewport.add_child(environment)

func equipment_page() -> void:
	label(content, "Equipamentos", 32)
	make_preview(true)
	label(content, "Selecione para equipar ou retirar.\nA espada permite golpear; roupas são cosméticas.", 18)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 9)
	grid.add_theme_constant_override("v_separation", 9)
	content.add_child(grid)
	for slot in FallSave.GEAR:
		var equipped: bool = game.save.data.equipment.get(slot, false)
		var item := button(grid, "%s\n%s" % [FallSave.GEAR[slot], "Equipado ✓" if equipped else "Equipar"], func():
			game.save.data.equipment[slot] = not game.save.data.equipment.get(slot, false)
			game.save.save_game()
			show_page("equipment"))
		item.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		item.add_theme_font_size_override("font_size", 16)
		if equipped:
			item.modulate = Color("7cf4d0")

func talent_page() -> void:
	label(content, "Habilidades e talentos", 30)
	var descriptions := {"vitality": "+10 de vida máxima por nível.", "agility": "Reduz a recarga da espada.", "guard": "Aumenta a proteção após dano."}
	for id in FallSave.TALENTS:
		var rank: int = game.save.data.talents[id]
		label(content, "%s · %d/3" % [FallSave.TALENTS[id], rank], 24)
		label(content, descriptions[id], 18)
		var buy := button(content, "Máximo" if rank == 3 else "Melhorar · %d moedas" % FallSave.COSTS[rank], func():
			game.save.upgrade(id)
			show_page("talents"))
		buy.disabled = rank == 3 or game.save.data.coins < FallSave.COSTS[mini(rank, 2)]

func shop_page() -> void:
	label(content, "Loja de aparências", 32)
	make_preview(true)
	label(content, "Ganhe moedas jogando. Sem compras com dinheiro real.", 18)
	for id in FallSave.SKINS:
		var owned: bool = id in game.save.data.owned
		var caption: String = FallSave.SKINS[id][0] + (" · Equipada" if id == game.save.data.skin else " · Equipar" if owned else " · %d moedas" % FallSave.SKINS[id][1])
		var buy := button(content, caption, func():
			game.save.choose_skin(id)
			show_page("shop"))
		buy.disabled = id == game.save.data.skin or (not owned and game.save.data.coins < FallSave.SKINS[id][1])

func show_help() -> void:
	clear_content()
	label(content, "Como jogar", 32)
	label(content, "Arraste no cenário para revelar o joystick. Solte para parar. Mova para os lados para contornar a torre e para cima/baixo para mudar de faixa.\n\nDois toques rápidos saltam. Você também pode usar o botão Saltar; com o joystick pressionado, dê os dois toques com outro dedo.\n\nProcure os portais dourados nas 12 áreas da fase 1. Cair fora do caminho tira 10 de vida e retorna à entrada.\n\nInimigos têm 3 pontos de vida. Pule na cabeça para quicar ou use a espada. Contato tira 5 de vida.\n\nPC: WASD/setas, Espaço para saltar, J para golpear e Esc para pausar.", 21)
	button(content, "Voltar", func(): show_page("world"))

func playing() -> void:
	menu_root.hide()
	hud.show()
	touch.show()
	touch.reset()
	attack_button.visible = game.save.data.equipment.get("weapon", false)
	update_hud()

func update_hud() -> void:
	if game.areas.is_empty():
		return
	title.text = "FASE %d · %s" % [game.stage, game.areas[mini(game.index, game.areas.size() - 1)].title]
	hp.max_value = game.player.max_health
	hp.value = game.player.health
	progress.text = "VIDA %d/%d   ·   %d/%d" % [game.player.health, game.player.max_health, game.index, game.areas.size()]
	wallet.text = "%d moedas   ·   %d pontos" % [game.save.data.coins, game.score]
	if game.stage > 1:
		wallet.text += "   ·   FEVER %s" % ("%.1fs" % game.fever if game.fever > 0 else "%d/5" % game.charge)
	attack_button.disabled = game.player.cooldown > 0

func pause_screen() -> void:
	touch.reset()
	touch.hide()
	menu_root.show()
	nav.hide()
	clear_content()
	label(content, "Pausa", 34)
	button(content, "Continuar", func(): game.resume_game())
	button(content, "Sair para o mundo", func(): game.go_home())

func results(win: bool) -> void:
	touch.hide()
	menu_root.show()
	nav.hide()
	clear_content()
	label(content, "Fase concluída!" if win else "Fim da tentativa", 34)
	label(content, "%d de %d\n%d pontos · +%d moedas" % [game.index, game.areas.size(), game.score, game.run_coins], 25)
	button(content, "Próxima fase" if win and game.stage < 999 else "Jogar novamente", func(): game.start_stage(mini(999, game.stage + 1) if win else game.stage))
	button(content, "Mundo", func(): game.go_home())

func _process(delta: float) -> void:
	if is_instance_valid(preview):
		preview.rotation.y += delta * 0.18
	if game.mode == "playing":
		notice.visible = game.notice_time > 0
		notice.text = game.notice_text
	else:
		notice.hide()
	# Honor Android cutouts and gesture navigation without changing the logical canvas.
	var actual := DisplayServer.get_display_safe_area()
	if actual.size.x > 0 and actual != screen_rect:
		screen_rect = actual
		var window := DisplayServer.window_get_size()
		var inset := float(maxi(0, actual.position.y)) / maxf(1, window.y) * root.size.y
		hud.position.y = maxf(25, inset + 12)
		var bottom := float(maxi(0, window.y - actual.end.y)) / maxf(1, window.y) * root.size.y
		main_margin.add_theme_constant_override("margin_top", int(maxf(35, inset + 12)))
		main_margin.add_theme_constant_override("margin_bottom", int(120 + bottom))
		nav.offset_top = -104 - bottom
		nav.offset_bottom = -14 - bottom
		action_row.offset_top = -106 - bottom
		action_row.offset_bottom = -24 - bottom
		notice.offset_top = -224 - bottom
		notice.offset_bottom = -120 - bottom
