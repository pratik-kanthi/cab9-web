(function (angular) {
    var module = angular.module('cab9.passengers');

    module.controller('PassengerItemNotesController', passengerItemNotesController);

    passengerItemNotesController.$inject = ['$scope', 'rNotes', '$state', '$modal', '$stateParams', '$q', 'Model', '$config', '$UI', 'rStaffs', 'rUsers'];

    function passengerItemNotesController($scope, rNotes, $state, $modal, $stateParams, $q, Model, $config, $UI, rStaffs, rUsers) {
        $scope.notes = rNotes;
        $scope.displayMode = "VIEW";
        $scope.addNote = addNote;
        $scope.editNote = editNote;
        $scope.deleteNote = deleteNote;
        $scope.getUserName = getUserName;

        function editNote(note) {
            var index = $scope.notes.indexOf(note);
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/notes.modal.html',
                controller: 'NoteEditController',
                size: 'lg',
                resolve: {
                    rNote: function () {
                        return new Model.Note(note);
                    }
                }
            })

            modalInstance.result.then(function (data) {
                Model.Note
                    .query()
                    .where('Id', '==', "guid'" + data.Id + "'")
                    .execute().then(function (response) {
                        $scope.notes[index] = response[0];
                    }, function (err) {
                        swal({
                            title: "Some Error Occured.",
                            text: "Some error has occured.",
                            type: "error",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    });
            }, function () {

            });
        }

        function addNote() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/notes.modal.html',
                controller: 'NoteCreateController',
                size: 'lg',
                resolve: {
                    rOwner: function () {
                        return 'PASSENGER'
                    }
                }
            });
            modalInstance.result.then(function (data) {
                Model.Note
                    .query()
                    .where('Id', '==', "guid'" + data.Id + "'")
                    .execute().then(function (response) {
                        $scope.notes.push(response[0]);
                    }, function (err) {
                        swal({
                            title: "Some Error Occured.",
                            text: "Some error has occured.",
                            type: "error",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    });
            });

        }

        function deleteNote(note) {
            swal({
                    title: "Are you sure?",
                    text: "Note will be deleted",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: '#DD6B55',
                    confirmButtonText: 'Yes, delete it!',
                    closeOnConfirm: false
                },
                function () {
                    var index = $scope.notes.indexOf(note);
                    new Model.Note(note).$delete().then(function (response) {
                        swal({
                            title: "Note Deleted.",
                            text: "Note has been deleted.",
                            type: "success",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                        $scope.notes.splice(index, 1);
                    })
                },
                function (err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
        }


        function getUserName(id) {

            var name = null;
            var user = rUsers.filter(function (u) {
                return u.Id == id;
            })[0];
            if (user) {
                return user.Name;
            }
            return name;
        }
    }
}(angular))