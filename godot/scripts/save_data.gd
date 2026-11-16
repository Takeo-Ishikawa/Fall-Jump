class_name FallSave
extends RefCounted

const SAVE_PATH := "user://progress-v1.json"
const GEAR := {"weapon": "Espada", "helmet": "Capuz de linho", "gloves": "Luvas macias", "boots": "Botas de trilha", "pants": "Calça de viagem", "armor": "Colete de linho"}
const TALENTS := {"vitality": "Vitalidade", "agility": "Espada ágil", "guard": "Fôlego protetor"}
const COSTS := [30, 60, 100]
const SKINS := {"melon": ["Melancia", 0, "2bd49d"], "lemon": ["Limão", 60, "ffc63e"], "blueberry": ["Mirtilo", 140, "7c85f7"], "strawberry": ["Morango", 260, "fa5b88"]}
var data: Dictionary = defaults()
var path := SAVE_PATH

static func defaults() -> Dictionary:
	return {"schema": 1, "coins": 0, "unlocked": 1, "selected": 1, "best": {}, "completed": {}, "equipment": {}, "talents": {"vitality": 0, "agility": 0, "guard": 0}, "owned": ["melon"], "skin": "melon"}

static func count(stage: int) -> int:
	return 12 if stage == 1 else 5 * (40 + mini(40, 6 * floori((stage - 1) / 2.0)))

func load_game() -> void:
	if not FileAccess.file_exists(path):
		return
	var parser := JSON.new()
	var raw = parser.data if parser.parse(FileAccess.get_file_as_string(path)) == OK else null
	if not raw is Dictionary:
		# Recover the last complete save after an interrupted write/corruption.
		raw = parser.data if FileAccess.file_exists(path + ".bak") and parser.parse(FileAccess.get_file_as_string(path + ".bak")) == OK else null
	if raw is Dictionary:
		normalize(raw)

func normalize(raw: Dictionary) -> void:
	data = defaults()
	data.coins = clampi(int(raw.get("coins", 0)), 0, 100000000)
	data.unlocked = clampi(int(raw.get("unlocked", 1)), 1, 999)
	data.selected = clampi(int(raw.get("selected", 1)), 1, data.unlocked)
	for key in ["best", "completed", "equipment", "talents"]:
		if raw.get(key) is Dictionary:
			for item in raw[key]:
				if key == "equipment" and GEAR.has(item):
					data.equipment[item] = raw[key][item] == true
				elif key == "talents" and TALENTS.has(item):
					data.talents[item] = clampi(int(raw[key][item]), 0, 3)
				elif key in ["best", "completed"] and str(item).is_valid_int() and int(item) >= 1 and int(item) <= data.unlocked:
					data[key][str(item)] = clampi(int(raw[key][item]), 0, count(int(item))) if key == "best" else raw[key][item] == true
	for id in SKINS:
		if raw.get("owned", []) is Array and id in raw.get("owned", []):
			if id not in data.owned:
				data.owned.append(id)
	if raw.get("skin", "melon") in data.owned:
		data.skin = raw.get("skin", "melon")

func save_game() -> bool:
	var file := FileAccess.open(path + ".tmp", FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(data))
	file.close()
	if FileAccess.file_exists(path):
		DirAccess.copy_absolute(path, path + ".bak")
	return DirAccess.rename_absolute(path + ".tmp", path) == OK

func record(stage: int, passed: int, win := false) -> void:
	var key := str(stage)
	data.best[key] = maxi(int(data.best.get(key, 0)), clampi(passed, 0, count(stage)))
	if win and passed >= count(stage):
		data.completed[key] = true
		data.unlocked = mini(999, maxi(data.unlocked, stage + 1))
	save_game()

func upgrade(id: String) -> bool:
	if not TALENTS.has(id):
		return false
	var rank: int = data.talents[id]
	if rank >= 3 or data.coins < COSTS[rank]:
		return false
	data.coins -= COSTS[rank]
	data.talents[id] += 1
	return save_game()

func choose_skin(id: String) -> bool:
	if not SKINS.has(id):
		return false
	if id not in data.owned:
		if data.coins < SKINS[id][1]:
			return false
		data.coins -= SKINS[id][1]
		data.owned.append(id)
	data.skin = id
	return save_game()

func earn(amount: int) -> void:
	data.coins = mini(100000000, data.coins + maxi(amount, 0))
	save_game()

func color() -> Color:
	return Color(SKINS[data.skin][2])
