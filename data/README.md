# AI4I 2020 Predictive Maintenance Dataset

## Dataset Source
- **Origin**: UCI Machine Learning Repository
- **URL**: https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset
- **Authors**: Stephan Matzka, School of Engineering - Technology and Life, HTW Berlin
- **Instances**: 10,000 synthetic records reflecting real milling machine operations.

## Features Schema
1. **UDI**: Unique identifier ranging from 1 to 10000.
2. **Product ID**: Consisting of a letter L, M, or H for low (50%), medium (30%), and high (20%) product quality variants, plus a variant-specific serial number.
3. **Type**: Product quality type (L, M, H).
4. **Air temperature [K]**: Generated using a random walk normalized to a standard deviation of 2 K around 300 K.
5. **Process temperature [K]**: Generated using a random walk normalized to a standard deviation of 1 K, added to the air temperature plus 10 K.
6. **Rotational speed [rpm]**: Calculated from a power of 2860 W, overlaid with normally distributed noise.
7. **Torque [Nm]**: Torque values normally distributed around 40 Nm with standard deviation = 10 Nm and no negative values.
8. **Tool wear [min]**: The quality variants H/M/L add 5/3/2 minutes of tool wear to the used tool in the process.
9. **Machine failure**: Target label that indicates whether the machine failed in this particular data point (0 = healthy, 1 = failure).

## Failure Modes (Failure Targets)
- **TWF (Tool Wear Failure)**: The tool wear reaches between 200 and 240 minutes.
- **HDF (Heat Dissipation Failure)**: Difference between air and process temperature < 8.6 K and rotational speed < 1380 rpm.
- **PWF (Power Failure)**: Mechanical power (Torque * speed in rad/s) < 3500 W or > 9000 W.
- **OSF (Overstrain Failure)**: Product of tool wear and torque exceeds variant limit (L: 11000, M: 12000, H: 13000 min*Nm).
- **RNF (Random Failure)**: Each process has a chance of 0.1% to fail regardless of tool wear.
