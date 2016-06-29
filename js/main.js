"use strict"; //ES6

var bShowDebug = false;

class Config {
	static get areSpritesCentered() {
		return true;
	}
}

var game_create = function()
{
	var app = new Application("KinderQuest", "content");
	window.app = app;
	
	var stateController = Service.Get("state");
	stateController.addState("loading", LoadingState);
	stateController.addState("manager", CharacterManagerState);
	stateController.addState("location", LocationState);
	stateController.addState("battle", BattleState);
	
	var resources = [
			"gfx/btn_blue.sprite",
			"gfx/btn_dark.sprite",
			"gfx/btn_white.sprite",
			"gfx/btn_white_sm.sprite",
			"gfx/workbench3.png",
			"gfx/map.png",
			"gfx/bg_DragonSaddle.jpg",
			"gfx/bg_Exiled.jpg",
			"gfx/bg_GnollMesa.jpg",
			"gfx/bg_GreatPlains.jpg",
			"gfx/bg_Horns.jpg",
			"gfx/bg_Kaisa.jpg",
			"gfx/bg_Kastador.jpg",
			"gfx/bg_ManyRivers.jpg",
			"gfx/bg_Sarathis.jpg",
			"gfx/bg_SeaGuard.jpg",
			"gfx/bg_Talmony.jpg",
			"gfx/bg_Tower.jpg",
			"gfx/grindquest/arm_cloth.png",
			"gfx/grindquest/arm_leather.png",
			"gfx/grindquest/arm_metal.png",
			"gfx/grindquest/axe_1h.png",
			"gfx/grindquest/craft_cloth.png",
			"gfx/grindquest/craft_metal.png",
			"gfx/grindquest/icon_book.png",
			"gfx/grindquest/icon_cup.png",
			"gfx/grindquest/icon_gear.png",
			"gfx/grindquest/icon_grind.png",
			"gfx/grindquest/icon_map.png",
			"gfx/grindquest/icon_rest.png",
			"gfx/grindquest/icon_return.png",
			"gfx/grindquest/icon_stop.png",
			"gfx/grindquest/icon_store.png",
			"gfx/grindquest/icon_target.png",
			"gfx/grindquest/mace_1h.png",
			"gfx/grindquest/staff_2h.png",
			"gfx/grindquest/sword_1h.png",
			"gfx/abilities/abilityIcons.sprite",
			"gfx/avatars/centaur_idle.sprite",
			"gfx/avatars/centaur_attack.sprite",
			"gfx/avatars/dwarf_idle.sprite",
			"gfx/avatars/dwarf_attack.sprite",
			"gfx/avatars/elf_idle.sprite",
			"gfx/avatars/elf_attack.sprite",
			"gfx/avatars/gnome_idle.sprite",
			"gfx/avatars/gnome_attack.sprite",
			"gfx/avatars/goblin_idle.sprite",
			"gfx/avatars/goblin_attack.sprite",
			"gfx/avatars/human_idle.sprite",
			"gfx/avatars/human_attack.sprite",
			"gfx/avatars/orc_idle.sprite",
			"gfx/avatars/orc_attack.sprite",
			"gfx/avatars/avatar.anim"
			];
	stateController.gotoState("loading", [resources, "manager"]); 
	
	app.Play();
};