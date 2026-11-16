class_name FallTouch
extends Control

signal jumped
var axis := Vector2.ZERO
var pointer := -1
var origin := Vector2.ZERO
var knob := Vector2.ZERO
var active := false
var taps: Dictionary = {}
var last_tap := -10.0
var last_tap_position := Vector2.ZERO
var clock := 0.0
var stick_radius := 65.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

func reset() -> void:
	axis = Vector2.ZERO
	pointer = -1
	active = false
	taps.clear()
	last_tap = -10
	queue_redraw()

func _process(delta: float) -> void:
	clock += delta

func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event is InputEventScreenTouch:
		if event.canceled:
			reset()
			return
		touch(event.index, event.position, event.pressed)
	elif event is InputEventScreenDrag:
		drag(event.index, event.position)
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		touch(100, event.position, event.pressed)
	elif event is InputEventMouseMotion and pointer == 100:
		drag(100, event.position)

func touch(id: int, at: Vector2, pressed: bool) -> void:
	if pressed:
		taps[id] = {"origin": at, "time": clock, "dragged": false}
		if pointer == -1:
			pointer = id
			origin = at
	else:
		if taps.has(id):
			var tap: Dictionary = taps[id]
			if not tap.dragged and clock - float(tap.time) < 0.28 and at.distance_to(tap.origin) < 14:
				if clock - last_tap < 0.28 and at.distance_to(last_tap_position) < 24:
					jumped.emit()
					last_tap = -10
				else:
					last_tap = clock
					last_tap_position = at
			taps.erase(id)
		if pointer == id:
			pointer = -1
			axis = Vector2.ZERO
			active = false
		queue_redraw()

func drag(id: int, at: Vector2) -> void:
	if taps.has(id) and not taps[id].dragged and at.distance_to(taps[id].origin) > 14:
		taps[id].dragged = true
		last_tap = -10
	if pointer != id:
		return
	var displacement := at - origin
	if not active and displacement.length() < 14:
		return
	active = true
	knob = displacement.limit_length(stick_radius)
	var raw := knob / stick_radius
	axis = Vector2(signf(raw.x) * maxf(0, absf(raw.x) - 0.15), signf(raw.y) * maxf(0, absf(raw.y) - 0.15)) / 0.85
	queue_redraw()

func _draw() -> void:
	if not active:
		return
	draw_circle(origin, stick_radius, Color(0.04, 0.14, 0.25, 0.65))
	draw_arc(origin, stick_radius, 0, TAU, 48, Color("69d8e3"), 2, true)
	draw_circle(origin + knob, 27, Color("4ae0b6"))
	draw_arc(origin + knob, 27, 0, TAU, 32, Color("b7fff1"), 2, true)
