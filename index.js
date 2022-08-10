const BsonUtils = Java.type("org.restheart.utils.BsonUtils");
const BsonArray = Java.type("org.bson.BsonArray");
const BsonDocument = Java.type("org.bson.BsonDocument");

export const options = {
    name: "restheart-dynamic-aggr-filter-plugin",
    description: "RestHeart Dynamic Aggregation Filter Plugin",
    uri: "/_dynamic_aggr_filter",
    secured: true
};

function replaceObjects(obj, targetProp, targetValue, replaceValue) {
    function getObject(theObj) {
        if (theObj instanceof Array) {
            for (let i = 0; i < theObj.length; i++) {
                getObject(theObj[i]);
            }
        }
        else {
            for (let prop in theObj) {
                if (theObj.hasOwnProperty(prop)) {
                    if (prop === targetProp) {
                        if (theObj[prop] === targetValue) {
                            theObj[prop] = replaceValue;
                        }
                    }
                    if (theObj[prop] instanceof Object ||
                        theObj[prop] instanceof Array) {
                        if (theObj[prop] instanceof Object) {
                            if (theObj[prop].hasOwnProperty(targetProp)) {
                                if (theObj[prop][targetProp] === targetValue){
                                    theObj[prop] = replaceValue;
                                }
                            }
                        }
                        getObject(theObj[prop]);
                    }
                }
            }
        }
    }
    getObject(obj);
}

function replaceVars(pipeline, vars) {
    for (var v in vars) {
        for (var prop in vars[v]) {
            replaceObjects(pipeline, '$var', prop, vars[v][prop]);
        }
    }
    return pipeline;
}

function getPipeline(db, coll, pipelineName) {

    const prop = db.getCollection("_properties", BsonDocument.class);

    var agg = JSON.stringify([
        { "$unwind": "$aggrs" },
        {
            "$match":
            {
                "_id": `_properties.${coll}`,
                "aggrs.uri": pipelineName
            }
        },
        {
            "$project": {
                "_id": 0,
                "aggrs.stages": 1
            }
        }
    ]);

    var res = prop.aggregate(BsonUtils.parse(agg)).iterator().next();
    var pipeline = res.aggrs.stages;
    var pipelineStr = BsonUtils.toJson(pipeline).replaceAll("_$", "$$");

    return JSON.parse(pipelineStr);
}

function runPipeline(coll, pipeline) {

    var agg = JSON.stringify(pipeline);

    let it = coll.aggregate(BsonUtils.parse(agg)).iterator();

    let results = new BsonArray();

    while (it.hasNext()) {
        results.add(it.next());
    }

    return BsonUtils.toJson(results);

}

function raiseError(msg, response) {
    response.setInError(400, msg);
    LOGGER.error(msg);
}

export function handle(request, response) {
    LOGGER.info("RestHeart Dynamic Aggregation Filter Plugin CALL");

    var content = JSON.parse(request.getContent());

    if (!(content instanceof Object)) {
        raiseError('Request body must be an object', response);
        return;
    }

    var dbname = content["Database"];
    var collname = content["Collection"];
    var agg = content["Aggregation"];
    var vars = content["Variables"];

    if(typeof dbname === 'undefined') {
        raiseError('Missing Database body parameter', response);
        return;
    }

    if(typeof collname === 'undefined') {
        raiseError('Missing Collection body parameter', response);
        return;
    }

    if(typeof agg === 'undefined') {
        raiseError('Missing Aggregation body parameter', response);
        return;
    }

    if(typeof vars === 'undefined') {
        raiseError('Missing Variables body parameter', response);
        return;
    }

    LOGGER.info(`[${dbname}][${collname}][${agg}] CALL`);

    LOGGER.debug(`[Database] ${dbname}`);
    LOGGER.debug(`[Collection] ${collname}`);
    LOGGER.debug(`[Aggregation] ${agg}`);
    LOGGER.debug(`[Variables] ${JSON.stringify(vars)}`);

    const db = mclient.getDatabase(dbname);

    var raw_pipeline = getPipeline(db, collname, agg);
    var pipeline = replaceVars(raw_pipeline, vars);

    LOGGER.debug(JSON.stringify(pipeline));

    const coll = db.getCollection(collname, BsonDocument.class);
    var results = runPipeline(coll, pipeline);
    
    LOGGER.info(`[${dbname}][${collname}][${agg}] RESULT: ${results.length} documents`);
    LOGGER.debug(JSON.stringify(results));

    response.setContent(results);
    response.setContentTypeAsJson();
}
