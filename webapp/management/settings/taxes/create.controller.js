(function () {

    var module = angular.module('cab9.settings');

    module.controller('SettingsTaxesController', settingsTaxesController);
    module.controller('SettingsTaxCreateController', settingsTaxCreateController);

    settingsTaxesController.$inject = ['$scope', 'rTaxes'];

    function settingsTaxesController($scope, rTaxes) {
        $scope.taxes = rTaxes;
    }

    settingsTaxCreateController.$inject = ['$scope', 'rTaxTypes', 'Model', '$state'];

    function settingsTaxCreateController($scope, rTaxTypes, Model, $state) {
        $scope.taxTypes = rTaxTypes;

        startNew();

        function startNew() {
            $scope.tax = new Model.Tax();
            $scope.tax.TaxComponents = [];
            $scope.displayMode = "CREATE";
            $scope.newComponent = null;
            $scope.selected = null;
        }

        $scope.createNewComponent = createNewComponent;
        $scope.addComponent = addComponent;
        $scope.cancelAdd = cancelAdd;
        $scope.selectComponent = selectComponent;
        $scope.deleteComponent = deleteComponent;
        $scope.updateComponent = updateComponent;
        $scope.cancelUpdate = cancelUpdate;
        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;

        function createNewComponent() {
            $scope.newComponent = new Model.TaxComponent();
        }

        function addComponent() {
            $scope.tax.TaxComponents.push($scope.newComponent);
            $scope.newComponent = null;
        }

        function cancelAdd() {
            $scope.newComponent = null;
        }

        function selectComponent(comp) {
            $scope.selected = comp;
        }

        function deleteComponent(comp) {
            var index = $scope.tax.TaxComponents.indexOf(comp);
            $scope.tax.TaxComponents.splice(index, 1);
        }

        function updateComponent(comp) {
            $scope.selected = null;
        }

        function cancelUpdate(comp) {
            $scope.selected = null;
        }

        function saveEdits() {
            $scope.tax.$save().success(function (res) {
                $scope.newComponent = null;
                swal("Success", "Tax Details Saved.", "success");
                $state.go('root.taxes', null, {
                    reload: true
                });
            }).error(function () {
                swal({
                    title: "Error Occured",
                    type: 'error'
                });
            });
        }

        function cancelEditing() {
            startNew();
        }
    }
}())