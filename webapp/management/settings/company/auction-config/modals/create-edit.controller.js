(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('CreateEditAutomationRuleModalController', CreateEditAutomationRuleModalController);

    CreateEditAutomationRuleModalController.$inject = ['$scope', 'rAutomationRule', 'rMode', 'rClients', 'rVehicleTypes', 'rDriverTypes', 'rLinkedDriverTypes', 'Auth', '$http', 'Model', '$UI', '$modal'];

    function CreateEditAutomationRuleModalController($scope, rAutomationRule, rMode, rClients, rVehicleTypes, rDriverTypes, rLinkedDriverTypes, Auth, $http, Model, $UI, $modal) {
        $scope.automationRule = rAutomationRule;
        $scope.clients = rClients;
        $scope.driverTypes = rDriverTypes;
        $scope.vehicleTypes = rVehicleTypes;
        $scope.mode = rMode;

        if($scope.mode == 'EDIT') {
            $scope.automationRule.$StartPeriodType = 'HOURS';
            $scope.automationRule.$EndPeriodType = 'HOURS';
            $scope.automationRule.$StartPeriodValue = $scope.automationRule.StartPeriod;
            $scope.automationRule.$EndPeriodValue = $scope.automationRule.EndPeriod;
            var rLinkedDriverTypeIds = rLinkedDriverTypes.map(function(item) { return item.Id });
            $scope.automationRule.$selectedDriverTypes = $scope.driverTypes.filter(function(item) {
                return rLinkedDriverTypeIds.includes(item.Id);
            });

        } else {
            $scope.automationRule.$selectedDriverTypes = [];
        }

        $scope.updateAutomationRule = updateAutomationRule;
        $scope.saveAutomationRule = saveAutomationRule;

        if($scope.automationRule != null)
        {
            if($scope.automationRule.DriverIdentifier) {
                $scope.automationRule.$DriverMode = 'Callsign';
            } else {
                $scope.automationRule.$DriverMode = 'DriverType';
            }
        }

        function updateAutomationRule() {
            $scope.$ruleSaving=true;
            if($scope.automationRule.$DriverMode === 'Callsign') {
                $scope.automationRule.DriverTypes = [];
                $scope.automationRule.$selectedDriverTypes = [];
            } else {
                $scope.automationRule.DriverIdentifier = null;
                $scope.automationRule.DriverTypes = $scope.driverTypes.filter(function(item) {
                    return $scope.automationRule.$selectedDriverTypes.includes(item.Id);
                })
            }
            
            $scope.automationRule.StartPeriod = $scope.automationRule.$StartPeriodValue * (($scope.automationRule.$StartPeriodType == 'HOURS')? 1:24);
            $scope.automationRule.EndPeriod = $scope.automationRule.$EndPeriodValue * (($scope.automationRule.$EndPeriodType == 'HOURS')? 1:24);

            $http.put($config.API_ENDPOINT + 'api/Bid/automation-rules?ruleId=' + $scope.automationRule.Id, $scope.automationRule)
                .success(function() {
                    $scope.$ruleSaving=false;
                    swal("Automation Rule Updated", "The automation rule has been updated. It will be active effective immediately.", "success");
                    location.reload();
                }).error(function(error) {
                    $scope.$ruleSaving=false;
                    swal("An Error Occurred.", (error.ExceptionMessage)? error.ExceptionMessage:"There was an error. Please try again.", "error");
                });
        }

        function saveAutomationRule() {
            $scope.$automationRuleSaving = true;

            $scope.automationRule.$$changedValues.DriverTypes = $scope.driverTypes.filter(function(item) {
                return $scope.automationRule.$selectedDriverTypes.includes(item.Id);
            })

            $scope.automationRule.StartPeriod = $scope.automationRule.$StartPeriodValue * (($scope.automationRule.$StartPeriodType == 'HOURS')? 1:24);
            $scope.automationRule.EndPeriod = $scope.automationRule.$EndPeriodValue * (($scope.automationRule.$EndPeriodType == 'HOURS')? 1:24);
            $http.post($config.API_ENDPOINT + 'api/Bid/automation-rules', $scope.automationRule.$$changedValues)
                .success(function() {
                    $scope.$newRuleSaving = false;
                    $scope.ruleViewMode = 'VIEW';
                    swal("Automation Rule Added", "The automation rule has been added. It will be active effective immediately.", "success");
                    location.reload();
                }).error(function(error) {
                    $scope.$newRuleSaving = false;
                    swal("An Error Occurred.", (error.ExceptionMessage) ? error.ExceptionMessage : "There was an error. Please try again.", "error");
                });
        }
        
    }
}(angular))
