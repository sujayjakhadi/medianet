import React, { Component, Fragment } from "react";
import { Table, Icon, Drawer, List, notification, Modal } from "antd";
import Websocket from "react-websocket";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import "./../css/stock.css";

export default class Stock extends Component {
    constructor() {
        super();
        this.state = {
            liveData: [],
            popContent: [],
            popTicker: ""
        };
        this.indexArr = [];
    }

    getInfo(record) {
        this.setState({
            popTicker: record.ticker.toUpperCase(),
            popContent: [...record.prevValues],
            drawerVisible: true
        });
    }

    getColumns = () => {
        return [
            {
                title: "Ticker",
                dataIndex: "ticker",
                render: text => <span> {text.toUpperCase()} </span>
            },
            {
                title: "Price",
                dataIndex: "value",
                render: (text, record) => {
                    return {
                        props: {
                            className: record.classname
                        },
                        children: (
                            <span>
                                {text.toFixed(2)}
                                {record.classname !== "first-price" && (
                                    <Icon
                                        onClick={() => this.getInfo(record)}
                                        style={{
                                            color: "blue",
                                            float: "right",
                                            fontSize: "16px"
                                        }}
                                        type="info-circle"
                                    />
                                )}
                            </span>
                        )
                    };
                }
            },
            {
                title: "Last Update",
                dataIndex: "updatedAt",
                render: text => <span> {this.getTimeDiff(text)} </span>
            },
            {
                title: "Trends",
                dataIndex: "prevValues",
                width: "25%",
                render: (text, record) => (
                	<Icon type="line-chart" onClick = {() => this.chartClicked(record)} />
                )
            }
        ];
    };

    getTimeDiff(input) {
        if (!input) return;
        let curDate = new Date();
        let diff = curDate - input;
        if (diff < 60000) return "A few seconds ago";
        if (diff < 3600000) {
            return Math.floor(diff / 60000) + " minute(s) ago";
        }
        if (diff < 86400000) {
            return Math.floor(diff / 3600000) + " Hour(s) ago";
        }
        return input.toLocaleString();
    }

    chartClicked(record) {
    	let recordObj = record.prevValues.map(obj => { return {prices: obj}});
    	let trendsRecord = [[...recordObj].reverse(), {prices: record.value}].flat()
    	this.setState({
    		trendsRecord: trendsRecord,
    		trendsVisible:record.ticker
    	})
    }

    hideTrends() {
    	this.setState({
    		trendsVisible:false,
    		trendsRecord: null
    	})
    }

    handleData(res) {
        let data = JSON.parse(res),
            liveData = [...this.state.liveData];
        data.forEach(obj => {
            let index = this.indexArr.indexOf(obj[0]);
            if (index === -1) {
                this.indexArr.push(obj[0]);
                liveData.push({
                    ticker: obj[0],
                    value: obj[1],
                    prevValues: [],
                    classname: "first-price",
                    updatedAt: new Date()
                });
            } else {
                let len = liveData[index].prevValues.unshift(
                    liveData[index].value
                );
                if (len > 5) {
                    liveData[index].prevValues.pop();
                }
                liveData[index].value = obj[1];
                liveData[index].updatedAt = new Date();
                liveData[index].classname =
                    liveData[index].prevValues[0] > obj[1]
                        ? "red-column price"
                        : liveData[index].prevValues[0] < obj[1]
                        ? "green-column price"
                        : "white-column price";
            }
        });
        this.setState({
            liveData: liveData
        });
    }

    socketConnected() {
    	notification.success({
		    message: 'Socket Connected', 
		    description:
		      'Web Socket connection established successfully',
		  });
    }

    socketDisconnected() {
    	notification.error({
		    message: 'Socket Disconnected',
		    description:
		      'Web Socket connection dropped',
		  });
    }

    render() {
        return (
            <Fragment>
                <div>
                    <Websocket
                        url="ws://stocks.mnet.website"
                        onMessage={(res) => this.handleData(res)}
                        onOpen = {() => this.socketConnected()}
                        onClose = {() => this.socketDisconnected()}
                    />
                </div>
                <div className="table-container">
                    <Table
                        pagination={{ pageSize: 25 }}
                        size="small"
                        columns={this.getColumns()}
                        dataSource={this.state.liveData}
                        bordered
                    />
                </div>

                <Drawer
                    title={`${this.state.popTicker}: History`}
                    placement="right"
                    onClose={() => {
                        this.setState({ drawerVisible: false });
                    }}
                    visible={this.state.drawerVisible}
                >
                    <List
                        size="small"
                        header={<div>Last 5 Prices</div>}
                        bordered
                        dataSource={this.state.popContent}
                        renderItem={item => (
                            <List.Item>{item.toFixed(2)}</List.Item>
                        )}
                    />
                </Drawer>
                {this.state.trendsVisible &&
                <Modal
		          title={`Trends: ${this.state.trendsVisible.toUpperCase()}`}
		          visible={this.state.trendsVisible}
		          onCancel = {() => this.hideTrends()}
		          footer={[]}
		        >
		          {this.state.trendsRecord && 

		          	<LineChart
				        width={500}
				        height={300}
				        data={this.state.trendsRecord}
				        margin={{
				          top: 5, right: 30, left: 20, bottom: 5,
				        }}
				      >
				        <CartesianGrid strokeDasharray="3 3" />
				        <XAxis />
				        <YAxis dataKey="prices" />
				        <Tooltip />
				        <Line type="monotone" dataKey="prices" stroke="#8884d8" />
				        
				      </LineChart>

                }
		        </Modal>
		    }
            </Fragment>
        );
    }
}
