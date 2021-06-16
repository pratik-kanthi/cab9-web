(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Document', 'api/documents', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            DocumentTypeId: {
                type: String,
                required: true,
                displayField: 'DocumentType.Name',
                table: {
                    hidden: true
                }
            },
            DocumentType: {
                type: 'DocumentType',
                ref: 'DocumentType',
                refBy: 'DocumentTypeId',
                table: {
                    hidden: true
                }
            },
            IssuedBy: {
                type: String
            },
            IssueDate: {
                type: moment,
                required: false,
                displayFilters: " | date:'dd/MM/yyyy'",
                table: {
                    visible: false
                }
            },
            ExpiryDate: {
                type: moment,
                required: false,
                displayFilters: " | date:'dd/MM/yyyy'",
                table: {
                    visible: false
                }
            },
            Active: {
                type: Boolean,
                defaultValue: true,
                table: {
                    visible: false
                }
            },
            FileType: {
                type: String
            },
            FilePath: {
                type: String
            },
            ThumbnailPath: {
                type: String
            },
            OwnerType: {
                type: String
            },
            OwnerId: {
                type: String,
                editable: false,
                hidden: true
            },
            CreationTime: {
                type: moment,
                display: 'Creation Time',
                table: {
                    hidden: true
                }
            },
            ModificationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            CreationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ModificationTime: {
                type: moment,
                display: 'Modification Time',
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);