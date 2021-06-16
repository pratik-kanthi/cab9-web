(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('BookingValidation', 'api/bookingvalidations', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String
            },
            BookingId: {
                type: String,
                required: true,
                displayField: 'Booking.Id',
                table: {
                    hidden: true
                }
            },
            Booking: {
                type: 'Booking',
                ref: 'Booking',
                refBy: 'BookingId',
                table: {
                    hidden: true
                }
            },
            ClientReferenceId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            ClientReference: {
                type: 'ClientReference',
                ref: 'ClientReference',
                refBy: 'ClientReferenceId',
                table: {
                    hidden: true
                }
            },
            Value: {
                type: String,
                required: true
            },
            CreationTime: {
                type: moment,
                display: 'Creation Date',
                displayFilters: " | companyDate:'DD/MM/YYYY'"
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
