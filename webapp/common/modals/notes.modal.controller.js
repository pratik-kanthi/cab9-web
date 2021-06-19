(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('NoteCreateController', noteCreateController);
    module.controller('NoteEditController', noteEditController);

    noteCreateController.$inject = ['$scope', '$UI', '$q', 'Model', '$stateParams', '$modalInstance', 'rOwner'];

    function noteCreateController($scope, $UI, $q, Model, $stateParams, $modalInstance, rOwner) {
        $scope.note = new Model.Note();
        $scope.displayMode = 'CREATE';
        $scope.save = save;

        function save() {
            $scope.note.Subject = "Note:";
            $scope.note.OwnerType = rOwner;
            $scope.note.OwnerId = $stateParams.Id;
            var promises = [];
            promises.push($scope.note.$save());
            $q.all(promises).then(function (result) {
                swal({
                    title: "Note Saved.",
                    text: "The note has been saved..",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $modalInstance.close(result[0].data);
            }, function (error) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error"
                });
            });
        }
    }

    noteEditController.$inject = ['$scope', '$UI', '$http', 'rNote', '$q', '$modalInstance'];

    function noteEditController($scope, $UI, $http, rNote, $q, $modalInstance) {
        $scope.note = rNote;
        $scope.displayMode = 'EDIT';

        $scope.save = save;

        function save() {
            var promises = [];
            promises.push($scope.note.$patch());
            $q.all(promises).then(function (result) {
                swal({
                    title: "Note Updated.",
                    text: "The note has been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $modalInstance.close(result[0].data);
            }, function (error) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });
        }
    }
}(angular))