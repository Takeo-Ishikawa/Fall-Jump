class_name FallCourse
extends RefCounted

const UNIT := 0.03
const STEP := TAU / 24.0
const SPACING := 6.15
var authored: Array = []

func _init() -> void:
	authored = JSON.parse_string(FileAccess.get_file_as_string("res://data/course.json"))

static func radius(lane: int) -> float:
	return (54.0 + 36.0 * (lane + 0.5)) * UNIT

static func point(lane: int, cell: float, angle := 0.0, height := 0.0) -> Vector3:
	var a := cell * STEP + angle
	return Vector3(sin(a) * radius(lane), height, cos(a) * radius(lane))

func generate(stage: int, seed_value := 123) -> Array:
	if stage == 1:
		var areas := authored.duplicate(true)
		for i in areas.size():
			areas[i]["angle"] = i * 0.7
			areas[i]["y"] = -i * SPACING
		return areas
	# Seeded circular stages keep the former length/difficulty curve.
	# This is a native generator, not a WebView or JavaScript dependency.
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value
	var areas: Array = []
	var intensity := minf(0.97, [0.25, 0.44, 0.64, 0.85, 0.49][(stage - 1) % 5] + mini(4, stage / 5) * 0.025)
	var angle := 1.3
	var last_special := -5
	var last_danger := -5
	for i in FallSave.count(stage):
		angle += rng.randf_range(-0.62, 0.62) if i % 6 > 1 else rng.randf_range(-0.08, 0.08)
		var gap := clampf(rng.randf_range(0.80, 0.94) - intensity * 0.12, 0.55, 1.0)
		var special := ""
		if i >= 3 and i - last_special >= 3 and i < FallSave.count(stage) - 1:
			var roll := rng.randf()
			if roll < 0.17:
				special = "bonus"
			elif stage >= 3 and roll < 0.26 + intensity * 0.1:
				special = "fragile"
			if special != "":
				last_special = i
		var danger := 0.0
		if i >= 3 and i - last_danger >= 3 and rng.randf() < 0.2 + intensity * 0.2 and i < FallSave.count(stage) - 1:
			danger = rng.randf_range(0.32, 0.53) + intensity * 0.12
			last_danger = i
		var tiles: Array = []
		# 96 segments preserve narrow openings and use native convex collisions.
		for cell in 96:
			var local := fposmod((cell + 0.5) * TAU / 96.0, TAU)
			if local < gap / 2.0 or local > TAU - gap / 2.0:
				continue
			tiles.append({"lane": 1, "cell": cell / 4.0, "width": 0.25, "wide": true, "height": 0, "fragile": special == "fragile", "bonus": special == "bonus", "danger": local > gap + 0.53 and local < gap + 0.53 + danger})
		var patrol = null
		if i >= 3 and i % (3 if stage >= 6 else 4) == 3 % (3 if stage >= 6 else 4) and special != "fragile":
			var start := gap + 0.53 + danger + 0.35
			if TAU - gap / 2.0 - 0.35 - start > 0.8:
				patrol = {"lane": 1, "from": start / STEP, "to": (TAU - gap / 2.0 - 0.35) / STEP}
		areas.append({"index": i, "angle": angle, "y": -i * SPACING, "title": "Torre %d · %d/%d" % [stage, i + 1, FallSave.count(stage)], "tip": "Procure o vão para descer. Evite as pedras vermelhas.", "entry": {"lane": 1, "cell": (gap / 2.0 + 0.4) / STEP - 0.5}, "tiles": tiles, "patrol": patrol, "ring": true, "special": special, "gap": gap})
	return areas
