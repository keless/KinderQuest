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
			"gfx/bgs/bg_DragonSaddle.jpg",
			"gfx/bgs/bg_Exiled.jpg",
			"gfx/bgs/bg_GnollMesa.jpg",
			"gfx/bgs/bg_GreatPlains.jpg",
			"gfx/bgs/bg_Horns.jpg",
			"gfx/bgs/bg_Kaisa.jpg",
			"gfx/bgs/bg_Kastador.jpg",
			"gfx/bgs/bg_ManyRivers.jpg",
			"gfx/bgs/bg_Sarathis.jpg",
			"gfx/bgs/bg_SeaGuard.jpg",
			"gfx/bgs/bg_Talmony.jpg",
			"gfx/bgs/bg_Tower.jpg",
			"gfx/items/arm_cloth.sprite",
			"gfx/items/arm_leather.sprite",
			"gfx/items/arm_metal.sprite",
			"gfx/items/icon_book.sprite",
			"gfx/items/icon_gear.sprite",
			"gfx/items/icon_grind.sprite",
			"gfx/items/icon_map.sprite",
			"gfx/items/icon_rest.sprite",
			"gfx/items/icon_return.sprite",
			"gfx/items/icon_stop.sprite",
			"gfx/items/weap_mace.sprite",
			"gfx/items/weap_bow.sprite",
			"gfx/items/weap_axe.sprite",
			"gfx/items/weap_staff.sprite",
			"gfx/items/weap_dagger.sprite",
			"gfx/items/weap_sword.sprite",
			"gfx/abilities/abilityIcons.sprite",
			"gfx/items/craft_cloth.sprite",
			"gfx/items/craft_leather.sprite",
			"gfx/items/craft_metal.sprite",
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
