import React from "react";
import {Button} from 'react-bootstrap';
import {Dropdown} from 'react-bootstrap';
import {DropdownButton} from 'react-bootstrap';
import {MenuItem} from 'react-bootstrap';

export default class Drivers extends React.Component {
    constructor(props) {
        super(props)
    }
    componentWillMount() {
        console.log("Component mounting")
    }

    componentWillUnmount() {
        console.log("Component unmounting")
    }

    selectDriver = (driver) => {
        this
            .props
            .selectDriver({driver});
    }

    render() {
        return (
            <div>
                {this
                    .props
                    .dispatchObj
                    .drivers
                    .byStatus
                    .map((status) => {
                        return <div key={status.status}>
                            {this.props.dispatchObj.filters.driverStatuses[status.status] && <div className={"shift-section " + status.status}>
                                <div className="header">{status.display + ' (' + status.drivers.length + ') Drivers'}</div>
                                {this
                                    .props
                                    .order(this.props.filter(status.drivers, this.props.dispatchObj.driverSearch), function (i) {
                                        return new moment('2017-01-01T' + i.EmptyTime).valueOf();
                                    }, true)
                                    .map((d) => {
                                        return <div key={d.DriverId} className="driver-strip-wrapper">
                                            <div className={"driver-strip " + d.DriverStatus}>
                                                <div className="driver">
                                                    <div className="info">
                                                        <strong
                                                            onClick={(event) => {
                                                            event.preventDefault();
                                                            this
                                                                .props
                                                                .dispatchObj
                                                                .drivers
                                                                .selectDriver(d);
                                                        }}>
                                                            {d.Notes && <span className="material-icons notes">note</span>}
                                                            {d.GoingHome && <span className="material-icons notes">home</span>}
                                                            {d.DriverCallsign + ' ' + d.DriverFirstname + ' ' + d.DriverSurname}</strong>
                                                            {d.DriverId && <div>
                                                            {
                                                                d.LastKnownShortLocation &&
                                                                <span>{d.LastKnownShortLocation} ({this.props.countdown(d.LastUpdateTime)})</span>
                                                            }
                                                            {!(d.LastKnownShortLocation) && <span className="text-muted">
                                                                <i className="fa fa-refresh fa-spin" aria-hidden="true"></i>
                                                                Fetching Location...
                                                            </span>
}
                                                        </div>}
                                                        {!d.DriverId && <div>
                                                            <span className="text-muted">Driver Offline</span>
                                                        </div>}

                                                    </div>
                                                </div>
                                                {d.DriverId && <div className="bookings">
                                                    <div className="stat">
                                                        <span className="number">{this
                                                                .props
                                                                .currencyFilter(d.WeeksEarnings, '£', 0)}</span>
                                                        <span className="lbl">Earnings</span>
                                                    </div>
                                                </div>}
                                                {d.DriverId && <div className="time">
                                                    <div
                                                        className="stat"
                                                        style={{
                                                        "textAlign": "left",
                                                        "paddingTop": "0",
                                                        "whiteSpace": "nowrap",
                                                        "overflow": "hidden",
                                                        "MsTextOverflow": "ellipsis",
                                                        "OTextOverflow": "ellipsis",
                                                        "textOverflow": "ellipsis"
                                                    }}>
                                                        <b
                                                            style={{
                                                            color: 'black'
                                                        }}>{this
                                                                .props
                                                                .timeFilter(d.ShiftLengthTime, 'HH:mm')}</b>
                                                        &nbsp;<b>Shift</b><br/>
                                                        <b
                                                            style={{
                                                            color: 'black'
                                                        }}>{this
                                                                .props
                                                                .timeFilter(d.EmptyTime, 'HH:mm')}</b>
                                                        &nbsp;<b>Empty</b>
                                                    </div>
                                                </div>}
                                                {(d.VehicleId) && <div className="vehicle">
                                                    <div className="number-plate">{d.VehicleReg}</div>
                                                    <div className="description">{d.VehicleDescription}</div>
                                                </div>}
                                                {(!d.VehicleId) && <div className="vehicle">
                                                    <div className="number-plate">N/A</div>
                                                    <div className="description">Vehicle Not Found</div>
                                                </div>}
                                                <div className="option">
                                                    <DropdownButton
                                                        className={((moment().diff(d.LastUpdateTime, 'minutes') < 7.5) ? (d.AutoDispatch ? 'btn btn-xs btn-success' : 'btn btn-xs btn-primary ') : 'btn btn-xs btn-primary late')}
                                                        noCaret
                                                        title={<i className={
                                                        (!d.$activity)
                                                            ? ((moment().diff(d.LastUpdateTime, 'minutes') < 7.5) ? (d.AutoDispatch ? 'fa fa-check' : 'fa fa-caret-down') : 'fa fa-exclamation-circle late')
                                                            : 'fa fa-circle-o-notch fa-spin'
                                                    } > </i>}
                                                        id={`dropdown-basic`}>
                                                        {(d.DriverStatus == 'Available' || d.DriverStatus == 'OnJob' || d.DriverStatus == 'Clearing' || d.DriverStatus == 'OnBreak') && <MenuItem
                                                            href="javascript:;"
                                                            onClick={(event) => {
                                                            event.preventDefault();
                                                            this
                                                                .props
                                                                .dispatchObj
                                                                .drivers
                                                                .nudgeDriverOnShift(d)
                                                        }}>

                                                            <i className="material-icons">settings_remote</i>
                                                            Nudge Driver
                                                        </MenuItem>}
                                                        {(d.DriverStatus == 'Available' || d.DriverStatus == 'OnBreak') && <MenuItem
                                                            href="javascript:;"
                                                            onClick={(event) => {
                                                            event.preventDefault();
                                                            this
                                                                .props
                                                                .dispatchObj
                                                                .drivers
                                                                .endShift(d)
                                                        }}>
                                                            <i className="material-icons">highlight_off</i>
                                                            End Shift
                                                        </MenuItem>
}                                                       <MenuItem href="javascript:;"
                                                            onClick={(event) => {
                                                            event.preventDefault();
                                                            this
                                                                .props
                                                                .dispatchObj
                                                                .drivers
                                                                .openNotesModal(d)
                                                        }}>
                                                            <i className="material-icons">note</i>
                                                            Notes
                                                        </MenuItem>

                                                        {(d.AutoDispatch) && <MenuItem
                                                            href="javascript:;"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                this
                                                                    .props
                                                                    .dispatchObj
                                                                    .drivers
                                                                    .toggleAutoDispatch(d, false)
                                                            }}>
                                                            <i className="material-icons">close</i>
                                                            AutoDispatch Off
                                                        </MenuItem>}

                                                        {(!d.AutoDispatch) && <MenuItem
                                                            href="javascript:;"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                this
                                                                    .props
                                                                    .dispatchObj
                                                                    .drivers
                                                                    .toggleAutoDispatch(d, true)
                                                            }}>
                                                            <i className="material-icons">check</i>
                                                            AutoDispatch On
                                                        </MenuItem>}

                                                        {(d.GoingHome) && <MenuItem
                                                            href="javascript:;"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                this
                                                                    .props
                                                                    .dispatchObj
                                                                    .drivers
                                                                    .toggleGoingHome(d, false)
                                                            }}>
                                                            <i className="material-icons">close</i>
                                                            Going Home Off
                                                        </MenuItem>}

                                                        {(!d.GoingHome) && <MenuItem
                                                            href="javascript:;"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                this
                                                                    .props
                                                                    .dispatchObj
                                                                    .drivers
                                                                    .toggleGoingHome(d, true)
                                                            }}>
                                                            <i className="material-icons">check</i>
                                                            Going Home On
                                                        </MenuItem>}

                                                        <MenuItem
                                                            href="javascript:;"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                this
                                                                    .props
                                                                    .dispatchObj
                                                                    .drivers
                                                                    .setLocation(d)
                                                            }}>
                                                            <i className="material-icons">check</i>
                                                            DEBUG: Set Location
                                                        </MenuItem>

                                                    </DropdownButton>
                                                </div>
                                            </div>
                                        </div>
                                    })}
                            </div>
}
                            <br className="clearfix"/>
                        </div>
                    })}
            </div>
        )
    }
}
