(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('TelephonyCall', 'api/TelephonyCall', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            CallIdentifier: {
                type: String,
            },
            StartTime: {
                type: moment,
                display: 'Creation Time',
                table: {
                    hidden: true
                }
            },
            AnsweredTime: {
                type: moment,
                display: 'Creation Time',
                table: {
                    hidden: true
                }
            },
            EndTime: {
                type: moment,
                display: 'End Time',
                table: {
                    hidden: true
                }
            },
            Caller: {
                type: String
            },
            NumberCalled: {
                type: String
            },
            StaffId: {
                type: String,
                required: true,
                displayField: 'Staff.Name'
            },
            Staff: {
                type: 'Staff',
                ref: 'Staff',
                refBy: 'StaffId',
                table: {
                    hidden: true
                }
            },
            BookingId: {
                type: String,
                required: true,
                displayField: 'Booking.LocalId'
            },
            Booking: {
                type: 'Booking',
                ref: 'Booking',
                refBy: 'BookingId',
                table: {
                    hidden: true
                }
            },
            RecordingUrl: {
                type: String
            }
        });
    }
})(angular);