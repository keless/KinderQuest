"use strict"; //ES6

/*
CastCommandState
  carries all the stateful information of an INSTANCE of a cast command
states:
 *evt begin cast
  casting 
 *evt cast complete
 if( channeled ) 
 *evt channel start
  *evt cast/channel tick
 *evt channel end
 endif( channeled )
 *evt begin travel
  traveling
 *evt hit (can hit target, or possibly be blocked earlier in path)
  lingering (on world, on target(s))
*/

class ICastCommandStateDelegate {
	onCastStart( ccs ) {}
	onCastComplete( ccs ) {}
	onChannelStart( ccs ) {}
	onChannelEnd( ccs ) {}
	onCooldownStart( ccs ) {}
	onCooldownEnd( ccs ) {}
}

class CastCommandState {
	static get IDLE() { return 0; }
	static get CASTING() { return 1; }
	static get CHANNELING() { return 2; }
	static get COOLDOWN() { return 3; }
	static get PASSIVE_ACTIVE() { return 4; }

	constructor(commandModel, entityOwner) {
		this.m_state = CastCommandState.IDLE; //CCSstate
		this.m_timeStart = 0; 							//double
		this.m_channelTicks = 0; 						//int
		this.m_pModel = commandModel; 			//CastCommandModel
		this.m_iOwner = entityOwner; 				//ICastEntity
		this.delegate = null;
		
		if(commandModel.isPassive()) {
			this.m_state = CastCommandState.PASSIVE_ACTIVE;
		}
		
		this.m_costStat = commandModel["costStat"] || ""; //string
		this.m_costVal = commandModel["costVal"] || 0;		//float
	}

	setDelegate(delegate) {
		this.delegate = delegate;
	}

	_onCastComplete() {
		if (this.m_state != CastCommandState.CASTING) return;

		var world = CastWorldModel.Get();
		if (!world.isValid(this.m_iOwner)) return;
		
		if(this.delegate) { this.delegate.onCastComplete(this); }

		//check for cost (but dont apply it yet)
		if (this.m_costVal != 0) {
			var res = this.m_iOwner.getProperty(this.m_costStat);
			
			//checking cost>0 so that if a tricky user wants cost to be 'negative' to 'add' value
			//  we can do that even if it is below resource (ex: cost = increased heat)
			if (this.m_costVal > 0 && this.m_costVal > res) {
				//not enough of resource to cast spell, so abort
				//todo: send evt aborted cast because of no resource
				this._onCooldownStart();
				return;
			}
		}

		var currTime = CastCommandTime.Get();
		this.m_timeStart = currTime;
		
		//spawn effects
		var target = this.m_iOwner.getTarget();
		var hasTargetInRange = target.hasTargetsAtRangeFromEntity(this.m_pModel.getRange(), this.m_iOwner);
		if (!hasTargetInRange) {
			this._onCooldownStart();
			return;
		}

		var foundTarget = false; //ensure we actually reach at least one target
		for (var i = 0; i < this.m_pModel.getNumEffectsOnCast(); i++) {
			//TODO: check for range
			
			var effect = new CastEffect();
			effect.init(this, i, this.m_iOwner, false);
			
			//TODO: send all effects as one array so only one "packet" has to travel
			
			world.addEffectInTransit(this.m_iOwner, effect, this.m_iOwner.getTarget(), currTime);
			foundTarget = true;
		}

		if (foundTarget && this.m_costVal != 0) {
			//apply cost
			this.m_iOwner.incProperty(this.m_costStat, -1 * this.m_costVal, null);
		}

		if (this.m_pModel.channelTime > 0) {
			//begin channeling
			this._onChannelStart();
		} else {
			this._onCooldownStart();
		}
	}

	_onChannelStart() {
		this.m_state = CastCommandState.CHANNELING;
		if(this.delegate) { this.delegate.onChannelStart(this); }
		this._scheduleCallback(this.m_pModel.channelFreq);
	}
	_onChannelComplete() {
		if (this.m_state != CastCommandState.CHANNELING) return;
		if (!CastWorldModel.Get().isValid(this.m_iOwner)) return;
		if(this.delegate) { this.delegate.onChannelEnd(this); }
		this._onCooldownStart();
	}
	_spawnChannelEffects() {
		var target = this.m_iOwner.getTarget();
		var hasValid = target.validateTargets();
		if(!hasValid) return false;

		for (var i = 0; i < this.m_pModel.getNumEffectsOnChannel(); i++) {
			var effect = new CastEffect();
			effect.init(this, i, this.m_iOwner, true);
			
			//TODO: send all effects as one array so only one 'packet' has to travel
			
			var world = CastWorldModel.Get();
			world.addEffectInTransit(this.m_iOwner, effect, this.m_iOwner.getTarget(), CastCommandTime.Get());
		}

		//some targets may have died since we applied effects, check again
		hasValid = target.validateTargets();
		if(!hasValid) return false;
		return true;
	}

	_onCooldownStart() {
		this.m_state = CastCommandState.COOLDOWN;
		this._scheduleCallback(this.m_pModel.cooldownTime);
		if(this.delegate) { this.delegate.onCooldownStart(this); }
	}

	_onCooldownComplete() {
		if (this.m_state != CastCommandState.COOLDOWN) return;
		if(this.delegate) { this.delegate.onCooldownEnd(this); }
		this._resetToIdle();
		//TODO: send cooldown complete signal
	}

	_resetToIdle() {
		var currTime = CastCommandTime.Get();
		this.m_timeStart = currTime;

		this.m_state = CastCommandState.IDLE;
	}

	_scheduleCallback(dt) {
		CastCommandScheduler.Get().scheduleSelector(this.onSchedulerTick.bind(this), dt);
	}

	_unscheduleCallback() {
		CastCommandScheduler.Get().unscheduleSelector(this.onSchedulerTick.bind(this));
	}
	
	//string
	getName() {
		return this.m_pModel ? this.m_pModel.getName() : null;
	}

	//bool
	isPassive() {
		return this.m_pModel.isPassive();
	}

	getPassiveOfType( type ) {
		return this.m_pModel.getPassiveOfType(type);
	}

	doSelfPassiveHealAndDamage() {
		if(!this.isPassive() || !this.isSelfTargeted()) return;
		var world = CastWorldModel.Get();
		var passiveEffects = this.getDescriptor("passiveEffects");
					
		var selfTarget = new CastTarget();
		selfTarget.addTargetEntity(this.m_iOwner);

		for(var i=0; i<passiveEffects.length; i++) {
			var e = passiveEffects[i];
			if(e.effectType == "heal" || e.effectType == "damage") {
				var effect = new CastEffect();
				effect.init(this, i, this.m_iOwner, false, true);
				world.addEffectInTransit(this.m_iOwner, effect, selfTarget, CastCommandTime.Get());
			}
		}
	}

	doAoePassiveHealAndDamage() {
		if(!this.isPassive() || this.isSelfTargeted()) return;
		var world = CastWorldModel.Get();
		var passiveEffects = this.getDescriptor("passiveEffects");
					
		var abilityRange = this.getRange();
		var ignoreFriendlies = [ this.m_iOwner ];
		var battleStateModel = Service.Get("battleStateModel");
		var targetArray = battleStateModel.GetEntitiesInRadius( this.m_iOwner.pos, abilityRange, ignoreFriendlies );

		var aoeTarget = new CastTarget();
		aoeTarget.addTargetEntityArray(targetArray);

		for(var i=0; i<passiveEffects.length; i++) {
			var e = passiveEffects[i];
			if(e.effectType == "heal" || e.effectType == "damage") {
				var effect = new CastEffect();
				effect.init(this, i, this.m_iOwner, false, true);
				world.addEffectInTransit(this.m_iOwner, effect, aoeTarget, CastCommandTime.Get());
			}
		}
	}
	
	//bool
	canAfford() {
		if (this.m_costStat == "" || this.m_costValue == 0) return true;

		var val = this.m_iOwner.getProperty(this.m_costStat);
		return val >= this.m_costVal;
	}

	//bool
	isSelfTargeted() {
		return this.m_pModel.isSelfTargeted();
	}
	
	//bool
	isCasting() {
		return this.m_state == CastCommandState.CASTING;
	}
	
	//float
	// 0 means 'not casting', 1.0 means 'cast complete'
	getCastPct() {
		if (this.m_state == CastCommandState.CASTING) {
			var currTime = CastCommandTime.Get();
			var delta = currTime - this.m_timeStart;
			if (delta > this.m_pModel.castTime) delta = this.m_pModel.castTime; //TODO: support dynamic cast time modification
			if (delta < 0) delta = 0;
			return delta / this.m_pModel.castTime;
		} else {
			return 0.0;
		}
	}
	
	//bool
	isChanneling() {
		return this.m_state == CastCommandState.CHANNELING;
	}
	
	//float
	// 0 means 'not channeling' 1.0 means 'channel complete'
	getChannelPct() {
		if (this.m_state == CastCommandState.CHANNELING) {
			var currTime = CastCommandTime.Get();
			var delta = currTime - this.m_timeStart;
			if (delta > this.m_pModel.channelTime) delta = this.m_pModel.channelTime; //TODO: support dynamic cast time modification
			if (delta < 0) delta = 0;
			return delta / this.m_pModel.channelTime;
		} else {
			return 0.0;
		}
	}
	
	//bool
	isOnCooldown() {
		return this.m_state == CastCommandState.COOLDOWN;
	}
	
	//float
	//0 means 'on cooldown', 1.0 means 'off cooldown'
	getCooldownPct() {
		if (this.m_state == CastCommandState.COOLDOWN) {
			var currTime = CastCommandTime.Get();
			var delta = currTime - this.m_timeStart;
			if (delta > this.m_pModel.cooldownTime) delta = this.m_pModel.cooldownTime; //TODO: support dynamic cooldown modification
			if (delta < 0) delta = 0;
			return delta / this.m_pModel.cooldownTime;
		} else {
			return 0.0;
		}
	}
	
	//bool
	isIdle() {
		return this.m_state == CastCommandState.IDLE;
	}
	
	//float 
	getRange() {
		return this.m_pModel ? this.m_pModel.getRange() : 0;
	}
	
	// in: _nullable string dataName
	//json
	getDescriptor(dataName) {
		dataName = dataName || "";

		if (!dataName) {
			return this.m_pModel.descriptor;
		}

		return this.m_pModel.descriptor[dataName] || {};
	}
	
	//bool
	startCast() {
		if (!this.isIdle()) return false; //cant start casting
		
		this.m_state = CastCommandState.CASTING;
		this.m_timeStart = CastCommandTime.Get();
		this.m_channelTicks = 0;

		if(this.delegate) { this.delegate.onCastStart(this); }

		if (this.m_pModel.castTime == 0) {
			//handle instant cast
			this.onSchedulerTick(0.0);
		} else {
			this._scheduleCallback(this.m_pModel.castTime);
		}

		return true;
	}

	stopCasting() {
		if(!this.isCasting() && !this.isChanneling()) {
			return false; //not casting/channeling
		}

		this._unscheduleCallback();

		if(this.isChanneling()) {
			// if cancelling channeling, do trigger cooldown
			this._onChannelComplete();
		}else {
			// if canceling casting, dont trigger cooldown
			this._resetToIdle();
		}
	}
	
	// in: double dt
	onSchedulerTick(dt) {
		var currTime = CastCommandTime.Get();
		var delta = currTime - this.m_timeStart;
		if (this.m_state == CastCommandState.CASTING) {
			if (delta >= this.m_pModel.castTime) { //TODO: handle cast speed increase
				//casting complete
				this._onCastComplete();
			} else {
				console.error("shouldnt happen, cast time");
			}
		} else if (this.m_state == CastCommandState.CHANNELING) {
			//TODO: handle channeling ticks
			if (delta > this.m_pModel.channelTime) delta = this.m_pModel.channelTime;
			var tickDelta = delta - this.m_pModel.channelFreq * this.m_channelTicks;

			var ticksToDo = ~~(tickDelta / this.m_pModel.channelFreq);
			var numTicks = ~~(this.m_pModel.channelTime / this.m_pModel.channelFreq);
			var ticksLeft = numTicks - this.m_channelTicks;
			if(ticksToDo > ticksLeft) {
				ticksToDo = ticksLeft;
			}

			var validTargets = true;
			for (var i = 0; i < ticksToDo; i++) {
				// do tick
				validTargets = this._spawnChannelEffects();
				this.m_channelTicks++;
			}

			ticksLeft = numTicks - this.m_channelTicks;
			if (ticksLeft <= 0 || !validTargets) {
				//cancel callback
				this._onChannelComplete();
			} else {
				this._scheduleCallback(this.m_pModel.channelFreq);
			}
		} else if (this.m_state == CastCommandState.COOLDOWN) {
			if (delta >= this.m_pModel.cooldownTime) { //TODO: ahndle cooldown redux
				//cancel callback
				this._onCooldownComplete();
			} else {
				console.error("shouldnt happen, cooldown time");
			}
		}
	}

	getAbilityId() {
		return this.m_pModel.descriptor["abilityId"];
	}
}

/*
 CastCommandModel
   carries shared resource information used to create CastCommandState objects from
     ie: one CastCommandModel represents "fireball", but three mages would each have their own CCS that points to the same CCM
*/

class CastCommandModel {
	constructor(jsonCastData) {
		var descriptor = jsonCastData;

		this.name = descriptor["name"] || "effectName"; //string
		
		//base values, unmodified by buff/debufs (which happens at time of cast)
		this.castTime = descriptor["castTime"] || 0.0; //float - zero if instant
		this.channelTime = descriptor["channelTime"] || 0.0; //float - zero if not channeled
		this.channelFreq = descriptor["channelFreq"] || 1.0; //float - tick freq of channeling
		this.travelSpeed = descriptor["travelSpeed"] || 0.0; //float - zero if instant
		this.range = descriptor["range"] || 0.0; //float - distance it can travel
		this.effectWhileTraveling = descriptor["effectWhileTravel"] || false; //bool - true if can cause effect while travelling (might be immediately consumed: fireball; or continue to effect while travelling: lava wall)
		this.stopOnHit = descriptor["stopOnHit"] || false; //bool
		
		this.cooldownTime = descriptor["cooldownTime"] || 0.0; //float - time in MS after castEnd before castBegin can start again
		this.effectSize = descriptor["effectSize"] || 0.0; //float - zero if no physics involved
		this.effectShape = 0; //int - singleTarget, line, cone, circle, etc
		
		this.selfTargeted = (descriptor["target"] || "") == "self";
		this._isPassive = ("passiveEffects" in descriptor);

		this.descriptor = descriptor; //json
	}
	
	//bool
	isChanneled() {
		return this.channelTime > 0;
	}
	
	//bool 
	isInstant() {
		return this.castTime <= 0;
	}

	isPassive() {
		return this._isPassive;
	}
	
	//float
	getPassiveOfType( type ) {
		if(!this._isPassive) return 0.0;
		for(var a of this.descriptor["passiveEffects"]) {
			if(a.effectType == type) {
				return a.valueMultiplier;
			}
		}
	}

	//int - per tick
	getNumEffectsOnChannel() {
		return (this.descriptor["effectsOnChannel"] || []).length;
	}
	
	// in: int idx
	//json
	getEffectOnChannel(idx) {
		return this.descriptor["effectsOnChannel"][idx];
	}

	//json
	getPassiveEffect(idx) {
		return this.descriptor["passiveEffects"][idx];
	}
	
	//int
	getNumEffectsOnCast() {
		return (this.descriptor["effectsOnCast"] || []).length;
	}

	isSelfTargeted() {
		return this.selfTargeted;
	}
	
	// in: int idx
	//json
	getEffectOnCast(idx) {
		return this.descriptor["effectsOnCast"][idx];
	}
	
	//float
	getRange() {
		return this.range;
	}
	
	//string
	getName() {
		return this.name;
	}

}

/*
 CastCommandScheduler
 used by CastCommandStates to schedule callbacks and timer ticks
*/

class CastCommandScheduler {
	static Get() {
		if (!CastCommandScheduler.instance) {
			CastCommandScheduler.instance = new CastCommandScheduler();
		}
		return CastCommandScheduler.instance;
	}

	constructor() {
		this.m_schedules = {}; //map< callback, atTime >
		
		this.lastUpdate = 0;
	}

	scheduleSelector(callback, dt) {
		var ct = CastCommandTime.Get();
		var time = ct + dt;
		if( this.m_schedules.hasOwnProperty(time) ) {
			this.m_schedules[time].push(callback);
		}else {
			this.m_schedules[time] = [ callback ];
		}
	}

	unscheduleSelector(callback) {
		delete this.m_schedules[callback];
	}

	Update() {
		var ct = CastCommandTime.Get();
		if (ct == this.lastUpdate) return; //dont replay updates if time hasnt progressed
		this.lastUpdate = ct;

		var removeList = [];

		for (var time in this.m_schedules) {
			if (time <= ct) {
				removeList.push(time);
				for( var callback of this.m_schedules[time]) {
					callback();
				}
			}
		}

		for (var i = 0; i < removeList.length; i++) {
			delete this.m_schedules[removeList[i]];
		}
	}
}

CastCommandScheduler.instance = null;
