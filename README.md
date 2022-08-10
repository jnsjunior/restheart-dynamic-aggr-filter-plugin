# RestHeart Dynamic Aggregation Filter Plugin

[![MIT License][license-shield]][license-url]

The purpose of this plugin is to provide a service to run [RestHeart](https://restheart.org/) aggregation with dynamic variable fields (even using [MongoDB](https://www.mongodb.com/) operators).
This aproach avoid turning off [aggregation-check-operators](https://restheart.org/docs/mongodb-rest/aggregations#Security%20considerations:~:text=Security%20considerations). This behavior protect data from undesirable malicious query injection.

## Getting Started

### Installation

1. Clone the repo inside RestHeart's plugin folder
   ```sh
   cd /opt/restheart/plugins
   git clone https://github.com/jnsjunior/restheart-dynamic-aggr-filter-plugin.git
   ```
2. Restart RestHeart instance (check [RestHeart](https://restheart.org/docs/setup) documentation)

## Usage example

1. Create a new database
   ```sh
   curl --request PUT \
        --url https://<your-restheart-host>/mydb \
        --header 'authorization: Basic <your-restheart-credentials>'
   ```
2. Create a new collection
   ```sh
   curl --request PUT \
        --url https://<your-restheart-host>/mydb/mycoll \
        --header 'authorization: Basic <your-restheart-credentials>'
   ```
3. Add new documents to the new collection
   ```sh
   curl --request POST \
        --url https://<your-restheart-host>/mydb/mycoll \
        --header 'authorization: Basic <your-restheart-credentials>'
        --data '[{ "item": "journal", "qty": 25, "size": { "h": 14, "w": 21, "uom": "cm" }, "status": "A" },{ "item": "notebook", "qty": 50, "size": { "h": 8.5, "w": 11, "uom": "in" }, "status": "A" },{ "item": "paper", "qty": 100, "size": { "h": 8.5, "w": 11, "uom": "in" }, "status": "D" },{ "item": "planner", "qty": 75, "size": { "h": 22.85, "w": 30, "uom": "cm" }, "status": "D" },{ "item": "postcard", "qty": 45, "size": { "h": 10, "w": 15.25, "uom": "cm" }, "status": "A" }]'
   ```
4. Create a new aggregation to the new collection
   ```sh
   curl --request PUT \
        --url https://<your-restheart-host>/mydb/mycoll \
        --header 'authorization: Basic <your-restheart-credentials>'
        --data '{"aggrs": [{"stages": [{ "$match": { "qty": { "$var": "n" } } },{ "$project": { "_id": "$item", "qty": "$qty" } }],"type": "pipeline","uri": "myagg"}]}'
   ```
5. Call plugin
   ```sh
   curl --request POST \
        --url https://<your-restheart-host>/_dynamic_aggr_filter \
        --header 'authorization: Basic <your-restheart-credentials>'
        --data '{"Database": "mydb","Collection": "mycoll","Aggregation": "myagg","Variables": [{"n": 25}]}'
   ```
   Result:
   ```sh
   [{"_id":"journal","qty":25}]
   ```
6. Another example using MongoDB operators
   ```sh
   curl --request POST \
        --url https://<your-restheart-host>/_dynamic_aggr_filter \
        --header 'authorization: Basic <your-restheart-credentials>'
        --data '{"Database": "mydb","Collection": "mycoll","Aggregation": "myagg","Variables": [{"n": {"$gte": 25, "$lt": 100}}]}'
   ```
   Result:
   ```sh
   [{"_id":"journal","qty":25},{"_id":"notebook","qty":50},{"_id":"planner","qty":75},{"_id":"postcard","qty":45}]
   ```

## Automatic tests

1. You can also run the automatic tests by running file test.sh inside test folder. 
   ```sh
   cd test
   chmod +x test
   ./test
   ```
2. Using [Visual Studio Code REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) (file test.http inside test folder)

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

João N de Souza Jr - [@jnsjunior](https://twitter.com/jnsjunior) - jnsjunior@gmail.com

Project Link: [https://github.com/jnsjunior/restheart-dynamic-aggr-filter-plugin](https://github.com/jnsjunior/restheart-dynamic-aggr-filter-plugin)

[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/othneildrew/Best-README-Template/blob/master/LICENSE.txt