(function (angular) {
    var module = angular.module('framework.directives.UI');

    module.directive('editModal', editModal);

    editModal.$inject = ['$parse', '$modal', '$http', '$config', '$filter', '$utilities', 'Model'];

    function editModal($parse, $modal, $http, $config, $filter, $utilities, Model) {
        return {
            scope: {
                data: '=',
                selected: '=',
                type: '@'
            },
            templateUrl: '/webapp/common/directives/editmodal/template.html',
            link: function (scope, elem, attrs) {
                scope.openEditModal = openEditModal;

                function openEditModal() {
                    if (scope.type == "Passenger") {
                        var modalInstance = $modal.open({
                            templateUrl: '/webapp/common/modals/passenger/create.modal.html',
                            controller: 'PassengerItemEditModalController',
                            resolve: {
                                rPassenger: function () {
                                    var Id = scope.data ? scope.data.Id : scope.selected.Id;
                                    return Model.Passenger.query().filter("Id eq guid'" + Id + "'").trackingEnabled().execute();
                                },
                                rNotes: ['$stateParams', 'Model', '$q', function ($stateParams, Model, $q) {
                                    var Id = scope.data ? scope.data.Id : scope.selected.Id;
                                    return Model.Note
                                        .query()
                                        .where("OwnerType eq 'PASSENGER'")
                                        .where("OwnerId eq guid'" + Id + "'")
                                        .execute();
                                }],
                                rStaff: ['Model', function (Model) {
                                    return Model.Staff
                                        .query()
                                        .select('Id, Firstname, Surname')
                                        .parseAs(function (item) {
                                            this.Name = item.Firstname + ' ' + item.Surname;
                                            this.Id = item.Id
                                        })
                                        .execute();
                                }],
                                rUsers: ['Model', function (Model) {
                                    return Model.User
                                        .query()
                                        .include('Claims')
                                        .execute();
                                }]
                            }
                        });
                        modalInstance.result.then(function (result) {
                            if (scope.data) {
                                scope.data.Name = result.Firstname + ' ' + result.Surname;
                                scope.data.Description = ((scope.data.Client && scope.data.Client.Name) ? scope.data.Client.Name : 'No Client');
                                scope.data.Mobile = result.Mobile;
                                scope.data.Addresses = result.Addresses;
                                scope.data.ImageUrl = $utilities.formatUrl(result.ImageUrl, result.Firstname);
                                scope.data.Notes = result.Notes;
                            }
                            if (scope.selected) {
                                scope.selected.Name = result.Firstname + ' ' + result.Surname;
                                scope.selected.Description = ((scope.data.Client && scope.data.Client.Name) ? scope.data.Client.Name : 'No Client');
                                scope.selected.Mobile = result.Mobile;
                                scope.selected.Addresses = result.Addresses;
                                scope.selected.ImageUrl = $utilities.formatUrl(result.ImageUrl, result.Firstname);
                                scope.selected.Notes = result.Notes;

                            }
                        });
                    } else if (scope.type == "Booker") {
                        var modalInstance = $modal.open({
                            templateUrl: '/webapp/common/modals/booker/modal.html',
                            controller: 'BookerEditController',
                            resolve: {
                                rBooker: function () {
                                    var Id = scope.data ? scope.data.Id : scope.selected.Id;
                                    return Model.ClientStaff.query().filter("Id eq guid'" + Id + "'").trackingEnabled().execute();
                                }
                            }
                        })
                        modalInstance.result.then(function (result) {
                            if (scope.data) {
                                scope.data.Name = result.Firstname + ' ' + result.Surname;
                                scope.data.Description = result.Email ? result.Email : "";
                                scope.data.Mobile = result.Mobile;
                                scope.data.ImageUrl = $utilities.formatUrl(result.ImageUrl, result.Name);
                            }
                            if (scope.selected) {
                                scope.selected.Name = result.Firstname + ' ' + result.Surname;
                                scope.selected.Description = result.Email ? result.Email : "";
                                scope.selected.Mobile = result.Mobile;
                                scope.selected.ImageUrl = $utilities.formatUrl(result.ImageUrl, result.Name);
                            }
                        });

                    }
                }
            }
        }
    }
})(angular);