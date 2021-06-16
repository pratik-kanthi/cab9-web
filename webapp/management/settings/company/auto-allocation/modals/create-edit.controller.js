(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('CreateEditAllocationRuleModalController', CreateEditAllocationRuleModalController);

    CreateEditAllocationRuleModalController.$inject = ['$scope', 'rAllocationRule', 'rMode', 'rClients', 'rVehicleTypes', 'rDriverTypes', 'rLinkedDriverTypes', 'Auth', '$http', 'Model', '$UI', '$modal'];

    function CreateEditAllocationRuleModalController($scope, rAllocationRule, rMode, rClients, rVehicleTypes, rDriverTypes, rLinkedDriverTypes, Auth, $http, Model, $UI, $modal) {
        $scope.allocationRule = rAllocationRule;
        $scope.clients = rClients;
        $scope.driverTypes = rDriverTypes;
        $scope.vehicleTypes = rVehicleTypes;
        $scope.mode = rMode;

        if($scope.mode == 'EDIT') {
            $scope.allocationRule.$StartPeriodType = 'HOURS';
            $scope.allocationRule.$EndPeriodType = 'HOURS';
            $scope.allocationRule.$StartPeriodValue = $scope.allocationRule.StartPeriod;
            $scope.allocationRule.$EndPeriodValue = $scope.allocationRule.EndPeriod;
            var rLinkedDriverTypeIds = rLinkedDriverTypes.map(function(item) { return item.Id });
            $scope.allocationRule.$selectedDriverTypes = $scope.driverTypes.filter(function(item) {
                return rLinkedDriverTypeIds.includes(item.Id);
            });
        }else {
            $scope.allocationRule.$selectedDriverTypes = [];
        }

        $scope.updateAllocationRule = updateAllocationRule;
        $scope.saveAllocationRule = saveAllocationRule;

        if($scope.allocationRule != null)
        {
            if($scope.allocationRule.DriverIdentifier) {
                $scope.allocationRule.$DriverMode = 'Callsign';
            } else {
                $scope.allocationRule.$DriverMode = 'DriverType';
            }
        }

        function updateAllocationRule() {
            $scope.$ruleSaving=true;
            if($scope.allocationRule.$DriverMode === 'Callsign') {
                $scope.allocationRule.DriverTypes = [];
                $scope.allocationRule.$selectedDriverTypes = [];
            } else {
                $scope.allocationRule.DriverIdentifier = null;
                $scope.allocationRule.DriverTypes = $scope.driverTypes.filter(function(item) {
                    return $scope.allocationRule.$selectedDriverTypes.includes(item.Id);
                })
            }

            $scope.allocationRule.StartPeriod = $scope.allocationRule.$StartPeriodValue * (($scope.allocationRule.$StartPeriodType == 'HOURS')? 1:24);
            $scope.allocationRule.EndPeriod = $scope.allocationRule.$EndPeriodValue * (($scope.allocationRule.$EndPeriodType == 'HOURS')? 1:24);

            $http.put($config.API_ENDPOINT + 'api/allocation-rules/update-rule?ruleId=' + $scope.allocationRule.Id, $scope.allocationRule)
                .success(function() {
                    $scope.$ruleSaving=false;
                    swal("Allocation Rule Updated", "The automation rule has been updated. It will be active effective immediately.", "success");
                    location.reload();
                }).error(function(error) {
                    $scope.$ruleSaving=false;
                    swal("An Error Occurred.", (error.ExceptionMessage)? error.ExceptionMessage:"There was an error. Please try again.", "error");
                });
        }

        function saveAllocationRule() {
            $scope.$allocationRuleSaving = true;

            $scope.allocationRule.StartPeriod = $scope.allocationRule.$StartPeriodValue * (($scope.allocationRule.$StartPeriodType == 'HOURS')? 1:24);
            $scope.allocationRule.EndPeriod = $scope.allocationRule.$EndPeriodValue * (($scope.allocationRule.$EndPeriodType == 'HOURS')? 1:24);

            $scope.allocationRule.$$changedValues.DriverTypes = $scope.driverTypes.filter(function(item) {
                return $scope.allocationRule.$selectedDriverTypes.includes(item.Id);
            })
            
            $http.post($config.API_ENDPOINT + 'api/allocation-rules/add-rule', $scope.allocationRule.$$changedValues)
                .success(function() {
                    $scope.$allocationRuleSaving=false;
                    $scope.ruleViewMode = 'VIEW';
                    swal("Auto Allocation Rule Added", "The auto allocation rule has been added. It will be active effective immediately.", "success");
                    location.reload();
                }).error(function(error) {
                    $scope.$newRuleSaving=false;
                    swal("An Error Occurred.", (error.ExceptionMessage)? error.ExceptionMessage:"There was an error. Please try again.", "error");
                });
        }
        
    }
}(angular))
