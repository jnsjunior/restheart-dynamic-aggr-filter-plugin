#!/bin/sh

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

createCollection() {
  result=`curl --request PUT -sS -o /dev/null -w '%{http_code}' \
    --url http://127.0.0.1:8080/mycoll \
    --header 'authorization: Basic YWRtaW46c2VjcmV0' \
    --header 'content-type: application/json' \
    --data @mycoll.json`
  
  if [ "$result" = "201" ]; then
    echo -e "Create Collection mycol ${GREEN}OK${NC}"
  else
    echo -e "Create Collection mycol ${RED}ERROR${NC}"
  fi
}

addCollectionData() {
  result=`curl --request POST -sS -o /dev/null -w '%{http_code}' \
    --url http://127.0.0.1:8080/mycoll \
    --header 'authorization: Basic YWRtaW46c2VjcmV0' \
    --header 'content-type: application/json' \
    --data @mycoll-data.json`

  if [ "$result" = "200" ]; then
    echo -e "Add Collection Data mycol ${GREEN}OK${NC}"
  else
    echo -e "Add Collection Data mycol ${RED}ERROR${NC}"
  fi
}

runTestCase() {
  expect=`cat $2 | python -m json.tool`
  result=`curl --request POST -sS \
    --url http://127.0.0.1:8080/_dynamic_aggr_filter \
    --header 'authorization: Basic YWRtaW46c2VjcmV0' \
    --header 'content-type: application/json' \
    --data @$1 | python -m json.tool`

  if [ "$result" = "$expect" ]; then
    echo -e "Test case: $1 ${GREEN}OK${NC}"
  else
    echo -e "Test case: $1 ${RED}ERROR${NC}"
  fi
}

docker-compose -f docker-compose.yml down > /dev/null
docker volume prune -f > /dev/null
docker-compose -f docker-compose.yml up -d --wait

echo "Start test"
echo ""
curl --request GET --url http://127.0.0.1:8080/ping
echo ""
createCollection
addCollectionData

echo ""
runTestCase test1-request.json test1-response.json
runTestCase test2-request.json test2-response.json
runTestCase test3-request.json test3-response.json

echo ""
echo "End test"
