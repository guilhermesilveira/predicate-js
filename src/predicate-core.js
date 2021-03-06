function BasePredicate(){}
BasePredicate.prototype = {};


function ChainablePredicate(matcher,parent,lhs){
  this.matcher = matcher;
  if(parent){
    this._parent = parent;
  }
  if(lhs){
    this._lhs = lhs;
  }
}

ChainablePredicate.prototype = new BasePredicate();

ChainablePredicate.prototype.matches = function(value,next){
  var self = this;
  next = next || function(val){return val;};
  if(this._parent){
    return this._parent.matches(value,function(val){
      return self.matcher.matches(val,next);
    });
  }
  return next(value);
};

ChainablePredicate.prototype.describe = function(description,next){
  var self = this;
  next = next || function(desc){return desc;};
  if(this._parent){
    return this._parent.describe(description,function(desc){
      return self.matcher.describe(desc,next);
    });
  }
  return next(description);
};

function CompositePredicate(matcher,lhs,rhs){
  this.matcher = matcher;
  this._lhs = lhs;
  this._rhs = rhs;
}

CompositePredicate.prototype = new BasePredicate();

CompositePredicate.prototype.matches = function(value,next){
  var self = this;
  next = next || function(val){return val;};
  function lhs(val){
    return self._lhs.matches(val);
  }
  if(this._rhs){
    function rhs (val){
      return self._rhs.matches(val);
    }
    return next(this.matcher.matches(value,lhs,rhs));
  }
  return this.matcher.matches(value,lhs,next);
};

CompositePredicate.prototype.describe = function(description,next){
  var self = this;
  next = next || function(desc){return desc;};
  function lhs (desc){
    return self._lhs.describe(desc);
  }
  if(this._rhs){
    function rhs (desc){
      return self._rhs.describe(desc);
    }
    return next(this.matcher.describe(description,lhs,rhs));
  }
  return this.matcher.describe(description,lhs,next);
};

function makeChainable(matcher,self){
  function execute(){
    return new ChainablePredicate(
      matcher.execute.apply(null, Array.prototype.slice.call(arguments)),
      self
    );
  }
  execute.__proto__ = new ChainablePredicate(matcher,self);
  return execute;
}

function makeComposite(matcher,lhs){
  function execute(rhs){
    return new CompositePredicate(
      matcher,
      lhs,
      rhs
    );
  }
  execute.__proto__ = new CompositePredicate(matcher,lhs);
  return execute;
}

function addChainablePredicate(name,matcher){
  Object.defineProperty(
    BasePredicate.prototype,
    name,
    {
      get : function(){
        return makeChainable(matcher,this);
      }
    }
  )
}

function addCompositePredicate(name,matcher){
  Object.defineProperty(
    BasePredicate.prototype,
    name,
    {
      get : function(){
        return makeComposite(matcher,this);
      }
    }
  )
}


function assertThat(reason,actual,matcher){
  if(!matcher){
    matcher = actual;
    actual = reason;
    reason = "";
  }
  if(!matcher.matches(actual)){
    throw new Error(reason + "\n\tExpected:" + matcher.describe("") + "\n\tActual: " + actual);
  }
}