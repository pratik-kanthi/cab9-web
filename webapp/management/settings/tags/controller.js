(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('TagManagementController', TagManagementController);

    TagManagementController.$inject = ['$scope', 'rTags', '$modal', 'Model', '$http', '$config', '$state'];

    function TagManagementController($scope, rTags, $modal, Model, $http, $config, $state) {
        $scope.tags = rTags;
        
        $scope.addTag = addTag;
        $scope.editTag = editTag;
        $scope.removeTag = removeTag;

        function addTag() {
            var existing = $scope.tags;

            $modal.open({
                size: 'lg',
                templateUrl: '/webapp/management/settings/tags/create-edit.modal.html',
                controller: ['$scope', '$modalInstance', 'rTag', function($scope, $modalInstance, rTag) {
                    $scope.item = rTag;

                    $scope.entity = [{
                        value: 1,
                        selected: false,
                        full: "Driver"
                    }, {
                        value: 2,
                        selected: false,
                        full: "Passenger"
                    }, {
                        value: 4,
                        selected: false,
                        full: "Vehicle"
                    }, {
                        value: 8,
                        selected: false,
                        full: "Client"
                    }];

                    $scope.save = save;
                    $scope.cancel = cancel;

                    function save() {
                        if ($scope.entity.filter(function(type) {
                                return type.selected == true
                            }).length > 0) {
                            $scope.item.EntityType = $scope.entity.reduce(function(prev, type) {
                                if (type.selected) {
                                    return prev + type.value;
                                } else {
                                    return prev;
                                }
                            }, 0);
                        } else {
                            $scope.item.EntityType = null;
                        }
                        $scope.item.$save().then(function(d) {
                            swal('Success', 'Tag has been Saved', 'success');
                            existing.push($scope.item);
                            $scope.item.EntityType = d.data.EntityType;
                            $modalInstance.dismiss();
                        });
                    }

                    function cancel() {
                        $modalInstance.dismiss();
                    }
                }],
                resolve: {
                    rTag: function() {
                        return new Model.Tag({
                            Type: 'Mandatory'
                        });
                    }
                }
            })
        }

        function editTag(t) {
            var existing = $scope.tags;

            $modal.open({
                size: 'lg',
                templateUrl: '/webapp/management/settings/tags/create-edit.modal.html',
                controller: ['$scope', '$modalInstance', 'rTag', function($scope, $modalInstance, rTag) {
                    $scope.item = rTag;

                    $scope.entity = [{
                        value: 1,
                        selected: $scope.item.EntityType && $scope.item.EntityType.indexOf('Driver') != -1,
                        full: "Driver"
                    }, {
                        value: 2,
                        selected: $scope.item.EntityType && $scope.item.EntityType.indexOf('Passenger') != -1,
                        full: "Passenger"
                    }, {
                        value: 4,
                        selected: $scope.item.EntityType && $scope.item.EntityType.indexOf('Vehicle') != -1,
                        full: "Vehicle"
                    }, {
                        value: 8,
                        selected: $scope.item.EntityType && $scope.item.EntityType.indexOf('Client') != -1,
                        full: "Client"
                    }];

                    $scope.save = save;
                    $scope.cancel = cancel;

                    function save() {
                        if ($scope.entity.filter(function(type) {
                                return type.selected == true
                            }).length > 0) {
                            $scope.item.EntityType = $scope.entity.reduce(function(prev, type) {
                                if (type.selected) {
                                    return prev + type.value;
                                } else {
                                    return prev;
                                }
                            }, 0);
                        } else {
                            $scope.item.EntityType = null;
                        }

                        $scope.item.$save().then(function(d) {
                            swal('Success', 'Tag has been Saved', 'success');
                            existing.push($scope.item);
                            $scope.item.EntityType = d.data.EntityType;
                            $modalInstance.dismiss();
                        });
                    }

                    function cancel() {
                        $modalInstance.dismiss();
                    }
                }],
                resolve: {
                    rTag: function() {
                        return t;
                    }
                }
            })
        }

        function removeTag(tag) {
            tag.$delete()
            .success(function () {
                var tagIndex = $scope.tags.indexOf(tag);
                $scope.tags.splice(tagIndex, 1);
                
                swal("Deleted", "Tag has been removed.", "success")
            })
            .error(function () {
                swal("Error!", "Error deleting tag as it is being used on some entity.", "error")
            });
        }
    }
}(angular))