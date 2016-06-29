"use strict"; //ES6

class SpawnFactory {

  static _getTypeLookupCache() {
    if(s_cachedTypeLookup == null) {
      s_cachedTypeLookup = {};
      for(var key in g_enemyTemplates) {
        var type = g_enemyTemplates[key].type;
        if(!s_cachedTypeLookup.hasOwnProperty(type)) {
          s_cachedTypeLookup[type] = [];
        }

        s_cachedTypeLookup[type].push(key);
      }
    }

    return s_cachedTypeLookup;
  }

  // given the location and player, spawn and return an appropriate enemy
  static SpawnEnemyForLocation(locIdx, playerModel) {

    var loc = g_locations[locIdx];
    var spawnTable = g_spawnTable[loc.name] || g_spawnTable["default"];

    var type = spawnTable.types[ getRand(0, spawnTable.types.length-1) ];
    console.log("spawn from type " + type)
    var typeLookup = SpawnFactory._getTypeLookupCache();
    var selection = s_cachedTypeLookup[type];

    var templateKey = selection[ getRand(0, selection.length-1) ];
    var enemyTemplate = g_enemyTemplates[templateKey];

    var enemy = new EntityModel();
		enemy.initWithJson(enemyTemplate);
        var abilityId = "attack1";
        var json = g_abilityCatalog[abilityId];
        json.abilityId = abilityId;
				var castCommandModel = new CastCommandModel( json.ranks[0] );
				var castCommandState = new CastCommandState(castCommandModel, enemy);
				enemy.addAbility(castCommandState);

    enemy.lootTable = g_lootTables[type];

    return enemy;
  }

  /**
   * return item or null
   */
  static DropLootForEnemy(enemyModel) {
    if(!enemyModel.lootTable) return null;
    for(var lootId in enemyModel.lootTable) {
      var lootChance = enemyModel.lootTable[lootId];
      var chance = getRand(0, 100);
      if( chance < lootChance ) {
        var itemModel = ItemModel.Get(lootId);

        if(itemModel.isStackable()) {
          itemModel.currStacks = 1;
        }

        return itemModel;
      }
    }
    return null;
  }
}

var s_cachedTypeLookup = null;