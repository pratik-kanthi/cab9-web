(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('DriverPaymentModelBonusController', driverPaymentModelBonusController);

    driverPaymentModelBonusController.$inject = ['$scope', '$UI', '$modal', 'rData', 'Model'];

    function driverPaymentModelBonusController($scope, $UI, $modal, rData, Model) {
        cancelEdit();
        $scope.DependsUpon = ["Booking", "Revenue"];
        $scope.Types = ["Fixed", "Percentage"];
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        $scope.addLevel = addLevel;
        $scope.getPrevious = getPrevious;
        $scope.remove = remove;

        function cancelEdit() {
            $scope.viewMode = "VIEW";
            $scope.item = rData[0];
            $scope.item.$bonus = $scope.item.BonusParameters ? JSON.parse($scope.item.BonusParameters) : {};
        }

        function getPrevious(s) {
            var index = $scope.item.$bonus.steps.indexOf(s);
            if (index <= 0) return 0;
            else
                return $scope.item.$bonus.steps[index - 1].max + 1;
        }

        function remove(s) {
            var index = $scope.item.$bonus.steps.indexOf(s);
            $scope.item.$bonus.steps.splice(index, 1);
        }

        function addLevel() {
            if ($scope.item.$bonus.steps && $scope.item.$bonus.steps.length > 0) {
                var last = angular.copy($scope.item.$bonus.steps[$scope.item.$bonus.steps.length - 1]);
                last.max = $scope.item.$bonus.steps[$scope.item.$bonus.steps.length - 1].max + 1;
                $scope.item.$bonus.steps.push(last);
            } else {
                if (!$scope.item.$bonus.steps)
                    $scope.item.$bonus.steps = []
                $scope.item.$bonus.steps.push({
                    max: 1,
                    bonus: 1
                });
            }
        }

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function saveEdits() {
            $scope.item.BonusParameters = JSON.stringify($scope.item.$bonus);
            $scope.item.$patch().then(function (response) {
                $scope.item = new Model.DriverPaymentModel(response.data);
                swal({
                    title: "Bonus Structure Updated Successfully.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.viewMode = "VIEW";
                $scope.item.$bonus = $scope.item.BonusParameters ? JSON.parse($scope.item.BonusParameters) : {};
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })

        }
    }
}(angular))