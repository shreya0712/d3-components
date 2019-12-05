import { Component, Prop, h } from "@stencil/core";
import * as d3 from "d3";
import stringData from "./data.js";

const defaultData = JSON.parse(stringData);
const xPoint = "x";
const xFormatted = "formatted";
const y1Point = "Yesterday";
const y2Point = "SDLW";

@Component({
  tag: "line-chart-2",
  styleUrl: "chart.css",
  shadow: true
})
export class Chart {
  private divRef: HTMLDivElement;
  private xAxisProps: {
    dataKey: string;
    tickSize?: number;
    fontSize?: string;
    strokeWidth?: number;
  };

  @Prop() width: string;
  @Prop() height: string;
  @Prop() marginleft: string;
  @Prop() marginright: string;
  @Prop() margintop: string;
  @Prop() marginbottom: string;
  @Prop() data: string;
  @Prop() data2: { key: string };
  @Prop() xAxis: string;

  constructor() {
    this.xAxisProps = JSON.parse(this.xAxis);
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

    const g = svg
      .append("g")
      .attr("transform", "translate(" + marginleft + "," + margintop + ")");
    return g;
  }

  componentDidRender() {
    console.log(this.data2);
    const data = this.data ? JSON.parse(this.data) : defaultData; //TODO: []
    const minMargin = 50;

    let width = +this.width || 400,
      height = +this.height || 500,
      marginbottom = minMargin + (+this.marginbottom || 0),
      margintop = +this.margintop || 0,
      marginleft = minMargin + (+this.marginleft || 0),
      marginright = +this.marginright || 0,
      pathHeight = height - margintop - marginbottom,
      pathwidth = width - marginleft - marginright,
      xTickWidth = 50;

    const g = this.createSvgGroup(
      this.divRef,
      width,
      height,
      marginleft,
      margintop
    );

    //scale
    const x = d3.scalePoint().range([0, pathwidth]);
    const y = d3.scaleLinear().range([pathHeight, 0]);

    const visibleTicks =
      data.filter((_d, i) => {
        const count = Math.floor(pathwidth / xTickWidth);
        const tickCount = Math.floor(data.length / count);
        return !(i % tickCount);
      }) || [];

    //axis generator
    const xAxisCall = d3
      .axisBottom(x)
      .tickValues(visibleTicks.map(d => d[xPoint]))
      .tickFormat(function(_d, i) {
        return visibleTicks.map(d => d[xFormatted])[i];
      });

    // const xAxisCall = d3.axisBottom(x).ticks(d3.timeDay);

    const yAxisCall = d3
      .axisLeft(y)
      .ticks(5)
      .tickFormat(d => d / 1000000 + "M");

    //axes groups

    const xAxis = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + pathHeight + ")");

    const yAxis = g
      .append("g")
      .attr("class", "y-axis")
      .attr("stroke-width", 1);

    //path generator
    const line = d3
      .line()
      .x(d => x(d[xPoint]))
      .y(d => y(d[y1Point]));
    // .curve(d3.curveMonotoneX);

    const line2 = d3
      .line()
      .x(d => x(d[xPoint]))
      .y(d => y(d[y2Point]));
    // .curve(d3.curveMonotoneX);

    // read and format data

    // data.forEach(d => {
    //   d[xPoint] = parseTime(d[xPoint]);
    // });

    //set domains for scales
    x.domain(data.map(d => d[xPoint]));
    y.domain([
      0,
      Math.max(
        d3.max(data, d => d[y1Point]),
        d3.max(data, d => d[y2Point])
      )
    ]);

    //generate axes

    xAxis.call(xAxisCall);
    yAxis.call(yAxisCall);

    const path2 = g
      .append("path")
      .data([data])
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke-width", 2)
      .attr("stroke", "#a7c3ff")
      .attr("d", line2);
    var totalLength2 = path2.node().getTotalLength();
    path2
      .attr("stroke-dasharray", totalLength2)
      .attr("stroke-dashoffset", totalLength2)
      .transition()
      .duration(1000)
      .attr("stroke-dashoffset", 0);
    const path1 = g
      .append("path")
      .data([data])
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke-width", 3)
      .attr("stroke", "#3275ff")
      .attr("d", line);
    var totalLength1 = path1.node().getTotalLength();

    path1
      .attr("stroke-dasharray", totalLength1)
      .attr("stroke-dashoffset", totalLength1)
      .transition()
      .duration(1000)
      .attr("stroke-dashoffset", 0);

    g.selectAll("line-circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "data-circle")
      .attr("fill", "white")
      .attr("stroke-width", 1)
      .attr("stroke", "#3275ff")
      .attr("cx", function(d) {
        return x(d[xPoint]);
      })
      .attr("cy", function(d) {
        return y(d[y1Point]);
      })
      .attr("r", 0)
      .transition()
      .duration(1000)
      .attr("r", 3);

    //tooltip
    const bisectDate = d3.bisector(d => d[xPoint]).left;
    const focus = g
      .append("g")
      .attr("class", "focus")
      .attr("display", "none");

    focus
      .append("line")
      .attr("class", "y-hover-line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("stroke", "grey")
      .attr("stroke-width", 0.5);
    const c1 = focus.append("circle").attr("r", 5);
    c1.attr("stroke-width", 2)
      .attr("stroke", "#a7c3ff")
      .attr("fill", "#3275ff");
    // const c2 = focus
    //   .append("circle")
    //   .attr("r", 2)
    //   .attr("fill", "#3275ff");
    focus
      .append("text")
      .attr("x", 15)
      .append("dy", "0.31em");

    g.append("rect")
      .attr("class", "overlay")
      .attr("height", pathHeight)
      .attr("width", pathwidth)
      .on("mouseover", function() {
        focus.style("display", "block");
      })
      .on("mouseout", function() {
        focus.style("display", "none");
      })
      .on("mousemove", function() {
        var eachBand = x.step();
        var index = Math.round(d3.mouse(this)[0] / eachBand);
        var x0 = x.domain()[index];
        const i = bisectDate(data, +x0, 0);
        const d = data[i];
        focus.attr(
          "transform",
          "translate(" + x(d[xPoint]) + "," + y(d[y1Point]) + ")"
        );
        focus.select("text").text(d[y1Point]);
        focus
          .select(".y-hover-line")
          .attr("y2", -y(d[y1Point]))
          .attr("y1", pathHeight - y(d[y1Point]));
        focus.select(".x-hover-line").attr("x2", -x(d[xPoint]));
      });
  }

  render() {
    return <div ref={el => (this.divRef = el as HTMLDivElement)}></div>;
  }
}
