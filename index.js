'use strict';

var EventEmitter = require('events').EventEmitter;

var options = global.SEQUENCE_OPTIONS || {};

function Sequence(){
	EventEmitter.call(this);  
}

function argsToArray(x){
	return x;
}

function reindex(array, startOfIndex){  // designed for 'triggers'
	for(var i = startOfIndex || 0; i < array.length; i++){
		array[i].SEQ_INDEX = i;
	}
};

function createTrigger(trigger_name){
	var fn = function(next){
		options.LOG_ON_TRIGGER_HIT && console.log('trigger', trigger_name);
		next();
	};
	fn.SEQ_TRIGGER_NAME = trigger_name;
	this._triggers = this._triggers || {};
	this._triggers[trigger_name] = fn;
	return fn;
}

Sequence.prototype = {
	__proto__: EventEmitter.prototype,
	opt_prototype: {},
	ASYNC: 1, // use function with "process.nextTick" or call it directly
	push: function(x){
		var i;
		this._list = this._list || [];
		i = this._list.length;
		this._list.push(x);
		reindex(this._list, i);    
		return this;
	},
	then: function(){ // promise-like function
		return this.push.apply(this, arguments);
	},
	replaceFunction: function(fn_name, fn, trigger_name){
		throw new Error('Not implemented!');
	},
	pushTrigger: function(trigger_name){    
		return this.push(createTrigger.call(this, trigger_name));
	},
	insertTrigger: function(link_trigger, trigger_name, directive){
		return this.insertIntoTrigger(link_trigger, createTrigger.call(this, trigger_name), directive);
	},
	insertIntoTrigger: function(trigger_name, fn, directive){
		directive = directive || 'back';
		if(!this._list) throw new Error('Trigger "' + trigger_name + '" not found!');
		for(var i = 0; i < this._list.length; i++){
			if(this._list[i].SEQ_TRIGGER_NAME === trigger_name){
				if(directive === 'back'){
					for(var j = i + 1; j < this._list.length; j++){
						if(this._list[j].SEQ_TRIGGER_NAME){
							this._list.splice(j,0,fn);
							reindex(this._list, j);
							return this;
						}	   
					}
					return this.push(fn);
				}
				else {
					this._list.splice(i+1,0,fn);
					reindex(this._list, i+1);
					return this;
				}
			}
		}
		throw new Error('Trigger "' + trigger_name + '" not found!');
	},
	clearTrigger: function(trigger_name){ // Not tested yet!
		var sq = this;
		if(sq._triggers && sq._triggers.hasOwnProperty(trigger_name)){
			var index = sq._triggers[this.TRIGGER].SEQ_INDEX;
			for(var i = index+1; i < sq._list.length && !sq._list[i].SEQ_TRIGGER_NAME; sq._list.splice(i,1));
		}
		else {
			throw new Error("Couldn't reach trigger: "+ trigger_name);
		}
	},	
	exec: function(){ // "TRIGGER" is not working //
		var index = 0;
		var args = Array.prototype.map.call(arguments, argsToArray);
		var sq = this;
		sq.emit.apply(sq,['start'].concat(args));
		execInternal.call(this);
		var opt = {
			__proto__: Sequence.prototype.opt_prototype,
			throw: function(){
				opt.emit.apply(this, ['error'].concat(Array.prototype.map.call(arguments, argsToArray)));
			},
			emit: function(){
				var localArgs = Array.prototype.map.call(arguments, argsToArray);
				var event = localArgs.splice(0, 1)[0];
				if(event)
					process.nextTick(function(){ 
						sq.emit.apply(sq, [event].concat(args).concat(localArgs));
					});
			}
		};
		function execInternal(){
			var localArgs = Array.prototype.map.call(arguments, argsToArray);
			if(this && this.TRIGGER){
				if(sq._triggers && sq._triggers.hasOwnProperty(this.TRIGGER)){
					index = sq._triggers[this.TRIGGER].SEQ_INDEX;
				}
				else {
					throw new Error("Couldn't reach trigger: "+ this.TRIGGER);
				}
			}
			if(sq._list && index < sq._list.length){       
				var fn = sq._list[index++];
				fn.apply(sq,[function(){
					var args_local = arguments;
					var options = this;
					sq.ASYNC ? process.nextTick(function(){
						execInternal.apply(options,args_local);
					}) : execInternal.apply(options,args_local);
				},opt].concat(args).concat(localArgs));
			}
			else {
				sq.emit.apply(sq, ['end'].concat(args).concat(localArgs));
			}
		}
	}
};


Object.defineProperty(module, "exports", {
	get: function(){
		return new Sequence();
	}
});


 
