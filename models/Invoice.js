(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];
    var currencyIcon = '£';

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Invoice', 'api/invoice', {
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
            InvoiceType: {
                type: String,
                table: {
                    visible: false
                }
            },
            Reference: {
                type: String
            },
            ClientId: {
                type: String,
                displayField: 'Client.Name',
                table: {
                    hidden: true
                },
                display: 'Client'
            },
            Client: {
                type: 'Client',
                ref: 'Client',
                refBy: 'ClientId',
                table: {
                    hidden: true
                }
            },
            _Client: {
                type: String,
                calculated: function () {
                    return this.Client ? '(' + this.Client.AccountNo + ')' + this.Client.Name : '';
                },
                display: 'Client'
            },
            DriverId: {
                type: String,
                displayField: 'Driver._Fullname',
                table: {
                    hidden: true
                }
            },
            Driver: {
                type: 'Driver',
                ref: 'Driver',
                refBy: 'DriverId',
                table: {
                    hidden: true
                }
            },
            Discount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            Notes: {
                type: String,
                table: {
                    visible: false
                }
            },
            BookingsSubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            BookingsTaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            ExtrasSubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            ExtrasTaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            WaitingSubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            WaitingTaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            AdjustmentsSubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            AdjustmentsTaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            DiscountTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            SubTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            TaxAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            TotalAmount: {
                type: Number,
                table: {
                    visible: false
                }
            },
            PaymentsTotal: {
                type: Number,
                table: {
                    visible: false
                }
            },
            CreationTime: {
                type: moment,
                display: 'Creation Date',
                displayFilters: " | companyDate:'DD/MM/YYYY'"
            },
            DueDate: {
                type: moment,
                display: 'Tax Date',
                required: true,
                displayFilters: " | companyDate:'DD/MM/YYYY'"
            },
            Bookings: {
                type: ['Booking'],
                ref: 'Booking',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            Adjustments: {
                type: ['ClientPricingAdjustment'],
                ref: 'ClientPricingAdjustment',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            NoOfBookings: {
                type: Number,
                display: 'Bookings'
            },
            Status: {
                type: String,
                enum: ['Unsent', 'Unpaid', 'Paid']
            },
            _SubTotal: {
                type: Number,
                calculated: function () {
                    var res = 0;
                    if (this.Bookings) {
                        for (var i = 0; i < this.Bookings.length; i++) {
                            res = (this.Bookings[i].InvoiceCost) ? res + this.Bookings[i].InvoiceCost : res + this.Bookings[i].ActualCost;
                        }
                    }
                    return res;
                },
                table: {
                    hidden: true
                }
            },
            _TaxAmount: {
                type: Number,
                calculated: function () {
                    var res = 0;
                    if (this.Bookings) {
                        for (var i = 0; i < this.Bookings.length; i++) {
                            if (this.Bookings[i].Tax) {
                                res = res + (this.Bookings[i].InvoiceCost * this.Bookings[i].Tax._TaxAmount);
                            }
                        }
                    }
                    return res;
                },
                table: {
                    hidden: true
                }
            },
            _TotalAmount: {
                type: Number,
                calculated: function () {
                    return (this._SubTotal + this._TaxAmount);
                },
                table: {
                    hidden: true
                }
            },
            PaymentInstructions: {
                type: String,
                textarea: 4,
                display: 'Payment Instructions',
                table: {
                    hidden: true
                }
            },
            Payments: {
                type: ['Payment'],
                ref: 'Payment',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            _AmountDue: {
                type: Number,
                calculated: function () {
                    var res = 0;
                    if (this.Payments) {
                        for (var i = 0; i < this.Payments.length; i++) {
                            res = res + this.Payments[i].AmountPaid;
                        }
                    }
                    return this.TotalAmount - res;
                },
                binding: function (item) {
                    return currencyIcon + item._AmountDue.toFixed(2);
                },
                display: 'Amount Due'
            },
            InvoiceDetails: {
                type: ['InvoiceDetail'],
                ref: 'InvoiceDetail',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            InvoiceSplitValue: {
                type: String,
                table: {
                    hidden: true
                }
            },
            InvoiceSplitField: {
                type: String,
                table: {
                    hidden: true
                }
            },
            InvoiceGroupField: {
                type: String,
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