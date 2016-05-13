````javascript
var app = angular.module('app', ['Resty', 'Entity']);

app.
    controller(
        'test',
        [
            '$scope',
            '$resty',
            '$entity',
            '$window',
            function ($scope, $resty, $entity) {

                $scope.storage = {
                    test: []
                };

                var collection = $entity(
                    'template',
                    $scope.storage,
                    'test',
                    $resty(
                        'http://localhost',
                        {
                            getAll: 'test',
                            getOne: 'test/:key',
                            delete: ['test?key=:key', 'delete'],
                            create: ['test', 'post'],
                            update: ['test/:key', 'put']
                        }
                    ),
                    {
                        delete: 'delete'
                    }
                )
                    .setModelMapper('key');

                collection.all().then(
                    function (res) {

                        // select model on index 0
                        collection.on(0);

                        // select or create model on index 3 then delete it (if index is out of array size model will be added after last existing)
                        collection.on(3, {field1: 'test'}).del();

                        // select model on index 0, set nested field then update it
                        collection.on(0).set('field2.field3', '1234').put();
                    }
                );
            }
        ]
    );
````