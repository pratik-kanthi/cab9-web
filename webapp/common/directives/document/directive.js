(function (angular) {
    var module = angular.module('cab9.common');

    module.directive('document', documentDirective);

    documentDirective.$inject = ['$state', '$interval', '$parse', '$config', '$modal', 'Model'];

    function documentDirective($state, $interval, $parse, $config, $modal, Model) {
        return {
            transclude: true,
            replace: true,
            scope: {
                data: "=",
                showOwner: "=",
                delete: "=",
                edit: "=",
                preview: "="
            },
            templateUrl: "/webapp/common/directives/document/template.html",
            link: function (scope, elem, attrs) {
                scope.API_ENDPOINT = $config.API_ENDPOINT;
                scope.openModalWithDocument = openModalWithDocument;
                scope.previewDocument = previewDocument;
                scope.deleteDocument = deleteDocument;

                function openModalWithDocument() {
                    var modalInstance = $modal.open({
                        templateUrl: '/e9_components/layouts/module/module-document-item.modal.html',
                        controller: 'ModuleDocumentItemEditController',
                        resolve: {
                            rDocument: function () {
                                return scope.data
                            },
                            rDocumentTypes: function () {
                                return Model.DocumentType
                                    .query()
                                    .execute();
                            }
                        }
                    })

                    modalInstance.result.then(function (data) {
                        swal("Document Updated!", "Document has been Updated.", "success");
                    }, function () {

                    });
                }

                function previewDocument() {
                    window.open(scope.API_ENDPOINT + scope.data.FilePath, '_blank');
                }

                function deleteDocument() {
                    swal({
                        title: "Are you sure?",
                        text: "You will not be able to recover the document!",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: $UI.COLOURS.brandPrimary,
                        confirmButtonText: "Confirm Delete!",
                        closeOnConfirm: true
                    }, function () {
                        FileUpload.delete(scope.data.Id).then(function () {
                            swal("Deleted!", "Document has been deleted.", "success");
                            $state.go($state.current, {}, {
                                reload: true
                            });
                            setupGrid();
                        }, function () {
                            swal("Error!", "Some Issue while deleting.", "error");
                        });
                    });
                }

            }
        }
    }
})(angular);