(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Conversation', 'api/Conversations', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            SenderId: {
                type: String,
                required: true,
                displayField: 'Sender.Name',
                table: {
                    hidden: true
                }
            },
            Sender: {
                type: 'User',
                ref: 'User',
                refBy: 'SenderId',
                table: {
                    hidden: true
                }
            },
            Type: {
                type: String,
                enum: ['Driver', 'Client']
            },
            BookingId: {
                type: String,
                required: true,
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
            MessageType: {
                type: String,
                enum: ['Text', 'Video', 'Image']
            },
            Body: {
                type: String
            },
            MediaUrl: {
                type: String
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