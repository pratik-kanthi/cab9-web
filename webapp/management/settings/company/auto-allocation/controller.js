(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('SettingsAutoAllocationController', SettingsAutoAllocationController);

    SettingsAutoAllocationController.$inject = ['$scope', 'rAutoAllocationRules', 'rClients', 'rVehicleTypes', 'rDriverTypes', 'Auth', '$http', 'Model', '$UI', '$modal', 'rExclusionRules'];

    function SettingsAutoAllocationController($scope, rAutoAllocationRules, rClients, rVehicleTypes, rDriverTypes, Auth, $http, Model, $UI, $modal, rExclusionRules) {
        $scope.autoAllocationRules = rAutoAllocationRules.sort(sortByProperty('-Active'));
        $scope.clients = rClients;
        $scope.driverTypes = rDriverTypes;
        $scope.vehicleTypes = rVehicleTypes;
        $scope.exclusionRules = rExclusionRules;

        $scope.ruleViewMode = 'VIEW';
        $scope.startRuleEdit = startRuleEdit;
        $scope.cancelRuleEdit = cancelRuleEdit;
        $scope.deleteAutoAllocationRule = deleteAutoAllocationRule;
        $scope.editAutoAllocationRule = editAutoAllocationRule;
        $scope.activateAllocationRule = activateAllocationRule;
        $scope.deactivateAllocationRule = deactivateAllocationRule;
        $scope.openExclusionsModal = openExclusionsModal;

        function startRuleEdit() {
            $scope.ruleViewMode = 'EDIT';
            var newRule = new Model.BiddingFilter();

            newRule.$StartPeriodType = 'HOURS';
            newRule.$EndPeriodType = 'DAYS';
            
            $modal.open({
                templateUrl: '/webapp/management/settings/company/auto-allocation/modals/create-edit.partial.html',
                controller: 'CreateEditAllocationRuleModalController',
                size: 'lg',
                resolve: {
                    rAllocationRule: function() {
                        return newRule;
                    },
                    rClients: function() {
                        return $scope.clients;
                    },
                    rVehicleTypes: function() {
                        return $scope.vehicleTypes;
                    },
                    rDriverTypes: function() {
                        return $scope.driverTypes;
                    },
                    rMode: function() {
                        return 'CREATE'
                    },
                    rLinkedDriverTypes: function() {
                        return null;
                    },
                }
            });

        }

        function cancelRuleEdit() {
            $scope.newRule = new Model.BiddingFilter();
            $scope.ruleViewMode = 'VIEW';
        }

        function sortByProperty(property) {
            var sortOrder = 1;
            if (property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function(a, b) {
                /* next line works with strings and numbers, 
                 * and you may want to customize it to your needs
                 */
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            }
        }


        function deleteAutoAllocationRule(ruleId) {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to delete the Auto Allocation rule?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Delete",
                closeOnConfirm: true
            }, function() {
                $http({
                    method: 'DELETE',
                    url: $config.API_ENDPOINT + 'api/allocation-rules/delete-rule?ruleId=' + ruleId
                }).then(function successCallback(response) {
                    swal("Auto Allocation Rule Deleted", "The auto allocation rule has been deleted.", "success");
                    location.reload();
                }, function errorCallback(error) {
                    swal("An Error Occurred.", (error.ExceptionMessage)? error.ExceptionMessage:"There was an error. Please try again.", "error");
                });
            }, function() {
                swal("Error!", "Some Issue while deleting.", "error");
            });
        }

        function deactivateAllocationRule(ruleId) {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to deactivate the Allocation rule?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Deactivate",
                closeOnConfirm: true
            }, function() {
                $http({
                    method: 'POST',
                    url: $config.API_ENDPOINT + 'api/allocation-rules/deactivate-rule?ruleId=' + ruleId
                }).then(function successCallback(response) {
                    swal("Allocation Rule Deactivated", "The allocation rule has been Deactivated.", "success");
                    location.reload();
                }, function errorCallback(error) {
                    swal("An Error Occurred.", (error.Message) ? error.Message : "There was an error. Please try again.", "error");
                });
            }, function() {
                swal("Error!", "Some Issue while deactivating rule.", "error");
            });
        }

        function openExclusionsModal(rule) {
            
            rule.exclusionRules = $scope.exclusionRules.filter(function(item) {
                return item.AutoAllocationRuleId == rule.Id;
            })
            $modal.open({
                templateUrl: '/webapp/management/settings/company/auto-allocation/modals/create-edit-exclusion.partial.html',
                controller: 'CreateEditAllocationExclusionRuleModalController',
                size: 'lg',
                resolve: {
                    rAllocationRule: function() {
                        return rule;
                    }
                }
            });
        }

        function activateAllocationRule(ruleId) {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to activate the Allocation rule?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Activate",
                closeOnConfirm: true
            }, function() {
                $http({
                    method: 'POST',
                    url: $config.API_ENDPOINT + 'api/allocation-rules/activate-rule?ruleId=' + ruleId
                }).then(function successCallback(response) {
                    swal("Allocation Rule activated", "The allocation rule has been Activated.", "success");
                    location.reload();
                }, function errorCallback(error) {
                    swal("An Error Occurred.", (error.Message) ? error.Message : "There was an error. Please try again.", "error");
                });
            }, function() {
                swal("Error!", "Some Issue while activating rule.", "error");
            });
        }

        function editAutoAllocationRule(autoAllocationRule) {
            $modal.open({
                templateUrl: '/webapp/management/settings/company/auto-allocation/modals/create-edit.partial.html',
                controller: 'CreateEditAllocationRuleModalController',
                size: 'lg',
                resolve: {
                    rAllocationRule: function() {
                        return autoAllocationRule;
                    },
                    rClients: function() {
                        return $scope.clients;
                    },
                    rVehicleTypes: function() {
                        return $scope.vehicleTypes;
                    },
                    rDriverTypes: function() {
                        return $scope.driverTypes;
                    },
                    rMode: function() {
                        return 'EDIT'
                    },
                    rLinkedDriverTypes: ['$http', '$config', function ($http, $config) {
                        return $http({
                            method: 'GET',
                            url: $config.API_ENDPOINT + '/api/allocation-rules/linked-driverTypes?ruleId=' + autoAllocationRule.Id
                        }).then(function successCallback(response) {
                            return response.data;
                        }, function errorCallback(error) {
                            swal("Error", "There was some error trying to fetch the driver types.", "error");
                        });
                    }]
                }
            });
        }
    }
}(angular))