# sequence
Designed for making event-based programming structure for node.js (also can be used as promises)

Simple usage (linear algorithm): (P.S sorry for demonstrating solution of useless task)
```
// application loading //

 // create new sequencer
var seq = require('sequence');

seq.then(function(next, opt, shared_object0, shared_object1, shared_object2 /* , ... */){
  shared_object0.some_var = 'some-string';
  
  // call next function with some arguments //
  next({integer_var: 0});
});

seq.then(function(next, opt, shared_object0, shared_object1, shared_object2 /* , ... */ arg0 /* , ... */){
  shared_object1.some_var = 'some-other-string';
  next({integer_var: arg0.interger_var+1});
});

seq.then(function(next, opt, shared_object0, shared_object1, shared_object2 /* , ... */ arg0 /* , ... */){
  shared_object2.some_var = 'new-string';
  shared_object2.some_integer_var = arg0.integer_var;
  next();
});

// when sequencer reaches the end of function list an "end" event is emitted //
seq.on('end', function(shared_object0, shared_object1, shared_object2){
  console.log(shared_object0, shared_object1, shared_object2);
});


// application run-time //
seq.exec(
 {}, // create object for "shared_object0"
 {}, // create object for "shared_object1"
 {} // create object for "shared_object2"
);


```

Example with loops (increase "i" to "j"):

```
// application loading //

 // create new sequencer
var seq = require('sequence');

seq.pushTrigger('INIT');

seq.then(function(next, opt, shared_object /* , ... */){
  shared_object.i = 0;
  
  // example usage of "opt" object
  if(typeof(shared_object.j) != 'number'){
    return opt.emit('error', '"j" is not a number');
    // you can also extend "opt" prototype via "seq.opt_prototype" //
  }
  
  next();
});

seq.pushTrigger('LOOP_WHILE_i_less_than_j');

seq.then(function(next, opt, shared_object /* , ... */){

  shared_object.i < shared_object.j
  ?
  // increasing variable (see next "seq.then") //
  next()
  :
  // we do not need "increasing" of "i" any more //
  next.call({TRIGGER: 'LOOP_WHILE_i_greater_or_equal_j'})
  
  
});

seq.then(function(next, opt, shared_object /* , ... */){

  shared_object.i++;
  
  // continue loop by calling the right trigger //
  next.call({TRIGGER: 'LOOP_WHILE_i_less_than_j'})
});

seq.then(function(next, opt, shared_object /* , ... */){
  throw new Error('This should not be called!');
});

seq.pushTrigger('LOOP_WHILE_i_greater_or_equal_j');

// you can add some similar stuff here //
//.....................................//

// when sequencer reaches the end of function list an "end" event is emitted //
seq.on('end', function(shared_object){
  console.log(shared_object);
});

// handle other events (in this example: "error") //
seq.on('error', function(shared_object, errmsg){
  console.log(shared_object, errmsg);
});

// application run-time //

// execute sequencer with good object //
seq.exec(
 {
  good: true,
  j: 5 // count to 5
 } // create object for "shared_object"
);

// at the same time execute sequencer with bad object //
seq.exec(
 {
  good: false,
  j: {} // not a number
 } // create object for "shared_object"
);


```

One of the goals of this little module is ablity to insert some additional stuff into it by using these functions:

```insertTrigger(link_trigger, trigger_name, directive='back')``` - inserts a new trigger with ```trigger_name``` at ```(``` ```directive == 'back' ? ``` end ``` : ``` top```)``` of ```link_trigger```

```insertIntoTrigger(link_trigger, fn, directive='back')``` - inserts a function like ```then```/```push``` do at ```(``` ```directive == 'back' ? ``` end ``` : ``` top```)``` of ```link_trigger```

more functions will come in a time (depends on how much I'll be free).

License - MIT
