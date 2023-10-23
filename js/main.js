// Hint: This is a good place to declare your global variables
var svg;
var width;
var height;
var margin;
var innerHeight;
var innerWidth;
var tooltip;
var xScale;
var yScale;
var barG;
var filtered_graph_data;

// This function is called once the HTML page is fully loaded by the browser
document.addEventListener('DOMContentLoaded', function () {
   // Hint: create or set your svg element inside this function
   svg = d3.select('#barChartSvg')
   width = +svg.style('width').replace('px', '');
   height = +svg.style('height').replace('px', '');
   margin = { top: 50, bottom: 50, right: 50, left: 60}
   innerWidth = width - margin.left - margin.right;
   innerHeight = height - margin.top - margin.bottom;
   
    
   // This will load your two CSV files and store them into two arrays.
   Promise.all([d3.csv('data/Q1-Graph1.csv')])
        .then(function (values) {
            graph_data = values[0];
            
            graph_data.map(function(d) {
                var baseDate = new Date("2025-01-01T00:00:00Z");
                d.Time = new Date(baseDate.getTime() + (d.Time * 1000));
                d.eType = +d.eType;
            });

            getCurData()

            tooltip = d3.select('#tooltip')
                    .attr("class", "tooltip")
                    .style("opacity", 0);
            
            barG = svg.append('g')
                    .attr('transform', 'translate('+margin.left+', '+margin.top+')');

            xScale = d3.scaleBand()
                    .domain(Object.keys(eTypeMap))
                    .range([0, innerWidth])
                    .padding(0.2);
            yScale = d3.scaleLinear()
                    .domain([0, d3.max(Object.values(eTypeMap))])
                    .range([innerHeight, 0]);
    
            barG.append('g')
                .attr('id', "yAxisLine")
                .call(d3.axisLeft(yScale));
            barG.append('g')
                .attr('id', 'xAxisLine')
                .attr('transform', `translate(0, ${innerHeight})`)
                .call(d3.axisBottom(xScale));
            barG.append('text')
                .attr('x', innerWidth / 2)
                .attr('y', innerHeight + 40)
                .text('Edge Type');
            barG.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', '-40px')
                .attr('x', -innerHeight / 2)
                .style('text-anchor', 'middle')
                .text('Count')

            drawBarChart();
            drawSourcePieChart(filtered_graph_data);
            drawTargetPieChart(filtered_graph_data);
        });
});


function getCurData() {
    // console.log('trace:getCurData()')
    const year_input = d3.select('#year-input')
    curYear = year_input.property('value')

    filtered_graph_data = []
    filtered_graph_data = graph_data.filter(function (d) {
        return curYear == d.Time.getFullYear()
    })

    eTypeMap = {}
    filtered_graph_data.forEach(d => {
        if (eTypeMap[d.eType] == undefined)
            eTypeMap[d.eType] = 0
        eTypeMap[d.eType] += 1
    })
}


// Use this function to draw the bee swarm chart.
function drawBarChart() {
    console.log('trace:drawBarChart()');
    
    getCurData()

    // console.log(eTypeMap)
    // console.log(filtered_graph_data)

    xScale = d3.scaleBand()
        .domain(Object.keys(eTypeMap))
        .range([0, innerWidth])
        .padding(0.2);
    yScale = d3.scaleLinear()
        .domain([0, d3.max(Object.values(eTypeMap))])
        .range([innerHeight, 0]);

    barG.select('#xAxisLine').call(d3.axisBottom(xScale));
    barG.select('#yAxisLine').call(d3.axisLeft(yScale));

    barG.selectAll('rect')
        .data(Object.entries(eTypeMap))
        .join(
            enter => enter
                .append('rect')
                .attr('x', d => xScale(d[0]))
                .attr('y', d => yScale(d[1]))
                .attr('width', xScale.bandwidth())
                .attr('height', d => yScale(0) - yScale(d[1]))
                .attr('fill', 'steelblue'),
            update => update
                .attr('x', d => xScale(d[0])) 
                .attr('y', d => yScale(d[1]))
                .attr('width', xScale.bandwidth())
                .attr('height', d => yScale(0) - yScale(d[1]))
                .attr('fill', 'steelblue'),
            exit => exit
                .remove()
        )
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", .9)
            tooltip.html("Edge Type: " + d[0] + "<br/>Count: " + d[1])
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY + 30) + "px")
        })
        .on("mousemove", function(event){
            tooltip.style('left', (event.pageX + 20) + "px")
                    .style("top", (event.pageY + 30) + "px")
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                    .duration(200)
                    .style('opacity', 0)
        });
}

function drawSourcePieChart(data){
    // console.log(data);
    const sourceFrequency = {};
    data.forEach(d => {
        if (sourceFrequency[d.Source]) {
            sourceFrequency[d.Source]++;
        } else {
            sourceFrequency[d.Source] = 1;
        }
    });
    const sourceData = Object.keys(sourceFrequency).map(key => ({
        source: key,
        frequency: sourceFrequency[key]
    }));
    // console.log(sourceData);
    // const width = 360;
    // const height = 360;
    const radius = Math.min(innerWidth, innerHeight) / 2;
    const color = d3.scaleOrdinal(d3.schemeSet1);
    const pieSvg = d3.select('#sourcepieChartSvg')
       .attr('width', width)
       .attr('height', height)
       .append('g')
       .attr('transform', 'translate(' + (width / 2) + 
       ',' + (height / 2) + ')');

    const arc = d3.arc()
    .innerRadius(0)            
    .outerRadius(radius);

    const pie = d3.pie()
       .value(function(d) { return d.frequency; })
       .sort(null);

    const path = pieSvg.selectAll('path')
    .data(pie(sourceData))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', function(d, i) {
        return color(d.data.source);
    })
    .style("stroke", "black")
    .style("stroke-width", 1)
    .on("mouseover", function(event, d) {
        tooltip.transition()
            .duration(100)
            .style("opacity", .9)
        tooltip.html("Source: " + d.data.source + "<br/>Count: " + d.data.frequency)
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY + 30) + "px")
    })
    .on("mousemove", function(event){
        tooltip.style('left', (event.pageX + 20) + "px")
                .style("top", (event.pageY + 30) + "px")
    })
    .on("mouseout", function(d) {
        tooltip.transition()
                .duration(200)
                .style('opacity', 0)
    });

    document.getElementById('edge-select').addEventListener('change', function(event){
        if(document.getElementById('edge-select').value === 'Total'){
            drawSourcePieChart(filtered_graph_data);
        }
        else{
            const selectedType = +document.getElementById('edge-select').value;
            // console.log(selectedType);
            // console.log(filtered_graph_data);
            const edgeFilteredData = filtered_graph_data.filter(d => d["eType"] === selectedType);
            // console.log(edgeFilteredData);
            // console.log(filtered_graph_data);
            d3.select('#sourcepieChartSvg').selectAll("*").remove();
            drawSourcePieChart(edgeFilteredData);
        }
    })

}

function drawTargetPieChart(data){
    
    const targetFrequency = {};
    data.forEach(d => {
        if (targetFrequency[d.Target]) {
            targetFrequency[d.Target]++;
        } else {
            targetFrequency[d.Target] = 1;
        }
    });
    const targetData = Object.keys(targetFrequency).map(key => ({
        target: key,
        frequency: targetFrequency[key]
    }));
    // console.log(targetData);
    // const width = 360;
    // const height = 360;
    const radius = Math.min(innerWidth, innerHeight) / 2;
    const color = d3.scaleOrdinal(d3.schemeSet1);
    const pieSvg = d3.select('#targetpieChartSvg')
       .attr('width', width)
       .attr('height', height)
       .append('g')
       .attr('transform', 'translate(' + (width / 2) + 
       ',' + (height / 2) + ')');

    const arc = d3.arc()
    .innerRadius(0)            
    .outerRadius(radius);

    const pie = d3.pie()
       .value(function(d) { return d.frequency; })
       .sort(null);

    const path = pieSvg.selectAll('path')
    .data(pie(targetData))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', function(d, i) {
        return color(d.data.target);
    })
    .style("stroke", "black")
    .style("stroke-width", 1)
    .on("mouseover", function(event, d) {
        tooltip.transition()
            .duration(100)
            .style("opacity", .9)
        tooltip.html("Target: " + d.data.target + "<br/>Count: " + d.data.frequency)
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY + 30) + "px")
    })
    .on("mousemove", function(event){
        tooltip.style('left', (event.pageX + 20) + "px")
                .style("top", (event.pageY + 30) + "px")
    })
    .on("mouseout", function(d) {
        tooltip.transition()
                .duration(200)
                .style('opacity', 0)
    });

    document.getElementById('targetedge-select').addEventListener('change', function(event){
        if(document.getElementById('targetedge-select').value === 'Total'){
            drawTargetPieChart(filtered_graph_data);
        }
        else{
            const selectedType = +document.getElementById('targetedge-select').value;
            // console.log(selectedType);
            // console.log(filtered_graph_data);
            const edgeFilteredData = filtered_graph_data.filter(d => d["eType"] === selectedType);
            // console.log(edgeFilteredData);
            // console.log(filtered_graph_data);
            d3.select('#targetpieChartSvg').selectAll("*").remove();
            drawTargetPieChart(edgeFilteredData);
        }
    })

}