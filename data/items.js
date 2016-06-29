"using strict"; //ES6
class ItemType {
	static get TRASH() { return 0; }
  static get MAINHAND() { return 1; }
	static get ARMOR() { return 2; }
  static get OFFHAND() { return 3; }
  static get TWOHANDED() { return 4; }
  static get CRAFT() { return 5; }
}

var g_items = {
  "wp_sword_1":{ type:ItemType.MAINHAND, hackColor:"#FF0000", stats:{"str_curr":10}, gold:5, img:"gfx/grindquest/sword_1h.png" },
  "wp_dagger_1":{ type:ItemType.MAINHAND, hackColor:"#FF0000", stats:{"agi_curr":10}, gold:5, img:"gfx/grindquest/sword_1h.png" },
  "wp_axe_2":{ type:ItemType.TWOHANDED, hackColor:"#FF00FF", stats:{"str_curr":20}, gold:10, img:"gfx/grindquest/axe_1h.png" },
  "wp_wand_1":{ type:ItemType.MAINHAND, hackColor:"#FF0000", stats:{"int_curr":10}, gold:5, img:"gfx/grindquest/staff_2h.png" },
  "arm_cloth_1":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"int_curr":10}, gold:5, img:"gfx/grindquest/arm_cloth.png" },
  "arm_leather_1":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"agi_curr":10}, gold:5, img:"gfx/grindquest/arm_leather.png" },
  "arm_metal_1":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"str_curr":10}, gold:5, img:"gfx/grindquest/arm_metal.png" },
  "mat_cloth_1":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:1, maxStacks:100, img:"gfx/grindquest/craft_cloth.png" },
  "mat_leather_1":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:1, maxStacks:100 },
  "mat_metal_1":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:1, maxStacks:100, img:"gfx/grindquest/craft_metal.png" }
}

var g_stores = {
  "default": {
    "items":[
      "wp_sword_1", "wp_dagger_1", "wp_axe_2", "wp_wand_1", 
      "arm_cloth_1", "arm_leather_1", "arm_metal_1", 
      "mat_cloth_1", "mat_leather_1", "mat_metal_1"
    ]
  }
}

function formatMoneyString(money) {
    var mS = ~~(money / 100);
    var mC = money - mS*100;
    var mG = ~~(mS / 100);
    mS = mS - mG*100;
    var mP = ~~(mG / 100);
    mG = mG - mP*100;
    return (mP+"p "+mG+"g "+mS+"s "+mC+"c");
}