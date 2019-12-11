import { Component, Prop, h } from "@stencil/core";
import * as d3 from "d3";

@Component({
  tag: "area-chart",
  styleUrl: "area.css",
  shadow: true
})
export class Chart {
  private divRef: HTMLDivElement;
  private xAxisProps: {
    dataKey: string;
    tickSize?: number;
    fontSize?: string;
    strokeWidth?: number;
    formattedKey?: string;
  };
  private yAxisProps: {
    dataKey: string;
    tickSize?: number;
    fontSize?: string;
    strokeWidth?: number;
    axisPrefix?: string;
  };

  @Prop() width: string;
  @Prop() height: string;
  @Prop() marginleft: string;
  @Prop() marginright: string;
  @Prop() margintop: string;
  @Prop() marginbottom: string;
  @Prop() data: string;
  @Prop() xaxis: string;
  @Prop() yaxis: string;
  @Prop() startcolor: string;
  @Prop() startopacity: string;
  @Prop() endcolor: string;
  @Prop() endopacity: string;
  @Prop() showaxes: string;

  constructor() {
    const xAxis = JSON.parse(this.xaxis);
    this.xAxisProps = {
      dataKey: xAxis.dataKey,
      tickSize: +xAxis.tickSize || 0,
      fontSize: xAxis.fontSize || 0,
      strokeWidth: +xAxis.strokeWidth || 0,
      formattedKey: xAxis.formattedKey
    };
    const yAxis = JSON.parse(this.yaxis);

    this.yAxisProps = {
      dataKey: yAxis.dataKey,
      tickSize: +yAxis.tickSize || 0,
      fontSize: yAxis.fontSize || 0,
      strokeWidth: +yAxis.strokeWidth || 0,
      axisPrefix: yAxis.axisprefix || ""
    };
  }

  createSvgGroup(parent, width, height, marginleft, margintop) {
    d3.select(parent)
      .select("svg")
      .remove();

    const svg = d3
      .select(parent)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g").attr("transform", "translate(" + marginleft + "," + margintop + ")");
    return g;
  }

  getVisibleTicks(data, axisLength, tickWidth) {
    return (
      data.filter((_d, i) => {
        const count = Math.floor(axisLength / tickWidth);
        const tickCount = Math.floor(data.length / count);
        return !(i % tickCount);
      }) || []
    );
  }
  appendPath(g, pathGenerator) {
    var defs = g.append("defs");

    var gradient = defs
      .append("linearGradient")
      .attr("id", "svgGradient")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
    gradient
      .append("stop")
      .attr("class", "start")
      .attr("offset", "0%")
      .attr("stop-color", this.startcolor)
      .attr("stop-opacity", this.startopacity);
    gradient
      .append("stop")
      .attr("class", "end")
      .attr("offset", "100%")
      .attr("stop-color", this.endcolor)
      .attr("stop-opacity", this.endopacity);

    pathGenerator.line
      ? g
          .append("path")
          .attr("class", "line")
          .datum(pathGenerator.filteredData)
          .attr("fill", "none")
          .attr("stroke", this.startcolor)
          .attr("stroke-width", 1)
          .attr("d", pathGenerator.line(true))
          .transition()
          .duration(1000)
          .attr("d", pathGenerator.line(false))
      : null;

    return g
      .append("path")
      .data([pathGenerator.filteredData])
      .attr("class", "area")
      .attr("d", pathGenerator.area(pathGenerator.filteredData, false))
      .attr("fill", "url(#svgGradient)")
      .transition()
      .duration(1000)
      .attr("d", d => pathGenerator.area(d, true));
  }

  componentDidRender() {
    const self = this;
    const data = this.data ? JSON.parse(this.data) : [];
    let width = +this.width || 0,
      height = +this.height || 0,
      marginbottom = +this.marginbottom || 0,
      margintop = +this.margintop || 0,
      marginleft = +this.marginleft || 0,
      marginright = +this.marginright || 0,
      pathHeight = height - margintop - marginbottom,
      pathwidth = width - marginleft - marginright,
      xTickWidth = 50,
      yTickWidth = 40,
      showaxes = +this.showaxes;

    const g = this.createSvgGroup(this.divRef, width, height, marginleft, margintop);

    //scale
    const x = d3.scalePoint().range([0, pathwidth]);
    const y = d3.scaleLinear().range([pathHeight, 0]);
    const xVisibleTicks = data;
    this.getVisibleTicks(data, pathwidth, xTickWidth);

    //axis generator
    const xAxisCall = d3.axisBottom(x).tickValues(
      xVisibleTicks.map(d => {
        return d[self.xAxisProps.dataKey];
      })
    );
    if (this.xAxisProps.formattedKey) {
      xAxisCall.tickFormat((_d, i) => {
        return xVisibleTicks.map(d => d[this.xAxisProps.formattedKey])[i];
      });
    }

    const yTickCount = Math.floor(pathHeight / yTickWidth);
    const yAxisCall = d3.axisLeft(y).ticks(yTickCount);

    //axes groups

    const xAxis = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + pathHeight + ")")
      .attr("stroke-width", isNaN(this.xAxisProps.strokeWidth) ? 1 : this.xAxisProps.strokeWidth);

    const yAxis = g
      .append("g")
      .attr("class", "y-axis")
      .attr("stroke-width", isNaN(this.yAxisProps.strokeWidth) ? 1 : this.yAxisProps.strokeWidth);

    //path generator

    const areaF = function(data, ignoreY, returnDefinedGenerator = false) {
      let generator = d3
        .area()
        .y0(pathHeight)
        .y1(function(d) {
          return y(ignoreY ? d[self.yAxisProps.dataKey] : 0);
        })
        .x(function(d) {
          return x(d[self.xAxisProps.dataKey]);
        })
        .curve(d3.curveMonotoneX);

      return returnDefinedGenerator
        ? generator.defined(function(d) {
            return d[self.yAxisProps.dataKey] !== null && d[self.yAxisProps.dataKey] !== undefined;
          })
        : generator(data);
    };

    const lineGenerator = function(ignoreY) {
      return d3
        .line()
        .x(function(d) {
          return x(d[self.xAxisProps.dataKey]);
        })
        .y(function(d) {
          return ignoreY ? pathHeight : y(d[self.yAxisProps.dataKey]);
        })
        .curve(d3.curveMonotoneX);
    };

    const areaGenerator: { area: any; filteredData?: any; line: any } = {
      area: areaF,
      line: lineGenerator,
      filteredData: data.filter(areaF([], false, true).defined())
    };

    //set domains for scales
    x.domain(data.map(d => d[self.xAxisProps.dataKey]));
    y.domain([0, d3.max(data, d => d[self.yAxisProps.dataKey]) * 1.2]);

    //generate axes
    if (showaxes !== 0) {
      xAxis.call(xAxisCall);
      yAxis.call(yAxisCall);
    }

    //append area
    var area = g.append("g").attr("class", "area");
    this.appendPath(area, areaGenerator);
  }

  render() {
    return <div ref={el => (this.divRef = el as HTMLDivElement)}></div>;
  }
}
