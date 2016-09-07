# JSMF-JSTL

JSTL is a model to model transformation engine that handle JSMF models. JSTL simplifies the transformation writing while leaving some responsibilities to the transformation developer following JavaScript way of thinking (e.g., the developer has to check for concurrent rules).


## Install

Thanks to npm: `npm install jsmf-jstl`

## Usage and Example
if you are not familiar with JSMF-CORE please see it first: https://github.com/JS-MF/jsmf-core.

In JSTL you define a set of transformation rules as inspired by ATL transformation Engine for EMF (https://eclipse.org/atl/).
Transformation rules an composed by input (*in*) and an output (*out*) pattern functions. 
The input is a function that process elements of a given input model, it provides the "set of element" that corresponds to a given pattern. For instance
this function can return all the elements that a "name" attributes or all elements that are conform to metaClass "Person".
The output pattern iterates over the fitered element and can create output elements for each of those.

You can also use Javascript function as helper and call them into the transformation rules.
Alike ATL, you can define helper attributes: function that will be launch once and that produce a value available in all transformations.

Let's take a simple example from ATL (https://wiki.eclipse.org/ATL/Tutorials_-_Create_a_simple_ATL_transformation).
In this example, we first select all the element conform to *Member* of the Family metamodel (named *MMI*). Then, we filter (using lodash _.filter)
and returning the result of the helper function *isFemale()*.
```javascript

//Helper function
function isFemale(member) {
    //Warning writting the function name... checking empty table
    return (member.familyMother.length!=0 || member.familyDaughter.length!=0);
}

var Member2Female = {

    in : function(inputModel) {
        return  _.filter(inputModel.Filter(MMI.Member),
                    function(elem){
                        return isFemale(elem);
                    });
    },

    out : function(inp) {
        var d = MMO.Female.newInstance('');
        familyName(inp);
        d.setFullName(inp.firstName+' '+familyName(inp));
        return [d];
    }
}
```

Launching the transformation is made by creating a new Transformation then by adding the rules it contains.
```javascript
var transformation = new Transformation();
transformation.addRule(Member2FeMale);
transformation.addRule(Member2Male);
```


Execution of transformation rule is made using the apply function on a transformation. The parameters
are the input Model and output model (as defined in JSMF).
```javascript
transformation.apply(M.ma, M.mb);

```

You can find examples, discover the other components and test it online with Tonic on JSMF github website (https://js-mf.github.io/#portfolio)

## License information

See [License](LICENSE).
