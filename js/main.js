edgeTypes = {
    0: "Email",
    1: "Phone",
    2: "Sell",
    3: "Buy",
    4: "Author-of",
    5: "Financial",
    6: "Travels-to"
}

// Define the reference date (12:00 AM on January 1, 2025)
const referenceDate = new Date('2025-01-01T00:00:00Z').getTime(); // Get time in milliseconds

var svg;
var margin, width, height, innerWidth, innerHeight;
var lineData;

// This function is called once the HTML page is fully loaded by the browser
document.addEventListener('DOMContentLoaded', function () {
    svg =  d3.select('#lineGraph')
            .append('svg'); 
    margin = { top: 10, right: 30, bottom: 30, left: 60 };
    width = +svg.style('width').replace('px','');
    height = +svg.style('height').replace('px','');
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;

    

    // This will load your CSV file and store them into the array.
   Promise.all([d3.csv('data/Q1-Graph1.csv')])
        .then(function (values) {
            data = values[0];
            
            // Data Wrangling
            data = data.filter(item => item.Time >= 0);

            // Extract eType and Time columns into a new array
            lineData = data.map(row => {
                // Convert the time from seconds to milliseconds and add it to the reference date
                const timeInMilliseconds = referenceDate + (row.Time * 1000);
                // Create a new Date object from the calculated time
                const dateObject = new Date(timeInMilliseconds);
                return {
                    eType: edgeTypes[row.eType], //converts # of etype to corresponding string value
                    Time: dateObject,
                };
            });

            drawLine();
    });
});

function drawLine(){
    // Create an object to store the frequency of eTypes by month
    eTypeFrequencyByMonth = {};

    lineData.forEach(item => {
        const time = item.Time.toISOString();
        const month = time.slice(0, 7); // Extract YYYY-MM for grouping by month
        eTypeFrequencyByMonth[month] = eTypeFrequencyByMonth[month] || {};
        eTypeFrequencyByMonth[month][item.eType] = (eTypeFrequencyByMonth[month][item.eType] || 0) + 1;
    });

    drawAxes();
    
    color = d3.scaleOrdinal().domain(Object.values(edgeTypes)).range(d3.schemePaired);

    // Group data by eType
    const eTypes = Object.values(edgeTypes)

    // Iterate through each edge type
    eTypes.forEach(function (edgeType) {
        // Extract the data for the current edge type
        var edgeData = Object.entries(eTypeFrequencyByMonth).map(function (d) {
            return { key: d[0], value: d[1][edgeType] || 0 };
        });
        console.log(edgeType)
        console.log(edgeData)

        // Create a line generator for the current edge type
        var line = d3.line()
            .x(function (d) { return xScale(d.key)})
            .y(function (d) { return yScale(d.value); });
    
        // Create a path (line) element for the current edge type
        svg.append("path")
            .data(edgeData)
            .attr("class", "line")
            .attr("d", line)
            .style("stroke", color(edgeType));
    });
    
};

function drawAxes(){
    // Extract the unique months
    const months = Object.keys(eTypeFrequencyByMonth);
        
    // Add axes and labels =========================
    // X-Axis
    const xScale = d3.scaleBand()
            .domain(months)
            .range([ 0, innerWidth ]);

    // Format the X-axis labels to display months
    const formatTime = d3.timeFormat("%b");

    svg.append("g")
        .attr("transform", "translate(60," + innerHeight + ")")
        .call(d3.axisBottom(xScale).tickFormat(d => formatTime(new Date(d))));

    svg.append("g")
        .append("text")
        .attr("dx", 300)
        .attr("dy", 395)
        .style("text-anchor", "middle")
        .text("Month of Records[2025]");

    // Y-Axis
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(months, month => d3.max(Object.keys(eTypeFrequencyByMonth[month]), eType => eTypeFrequencyByMonth[month][eType]))])
        .range([innerHeight, 0]);

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    svg.append("g")
        .append("text")
        .attr('transform','rotate(-90)')
        .attr("dx", -175)
        .attr("dy", 20)
        .style("text-anchor", "middle")
        .text("Frequency of Edges");
}