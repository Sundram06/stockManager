Stock Manager is a simple yet powerful application designed to help investors accurately track their stock purchases, sales, and profits/losses on a First-Come-First-Serve (FCFS) basis, ensuring clear insights into portfolio performance and realized gains.

Lets understand with an example scenario. 

************************App Concept Overview************************

The app helps users track:

1. Stock Purchases
You bought 300 shares of Company X in 3 separate lots:

Lot 1: 100 shares at ₹10 each.
Lot 2: 100 shares at ₹20 each.
Lot 3: 100 shares at ₹30 each.
_______________________________________________________________

2. Stock Sales
You sold 150 shares when the price reached ₹40. Following the FCFS principle, the sold stocks come from the first lots you purchased.
_______________________________________________________________

3. Profit Calculation
The profit is calculated based on the difference between the selling price and the buying price of each lot, in FCFS order.

_______________________________________________________________

******************Tables for Explanation******************

Table 1: Stock Purchases

| Lot No. | Quantity | Purchase Price (₹) | Total Cost (₹) |
|---------|----------|-------------------|---------------|
| Lot 1   | 100      | 10                | 1000          |
| Lot 2   | 100      | 20                | 2000          |
| Lot 3   | 100      | 30                | 3000          |
| **Total** | **300**  | **Avg: ₹20**       | **6000**       |


_______________________________________________________________

Table 2: Stocks Sold (FCFS Order)
You sell 150 shares at ₹40. (100 shares of 10rs + 50 shares of 20rs = 2000rs = C.P of these shares )

| Lot No. | Quantity Sold | Purchase Price (₹) | Selling Price (₹) | Total Cost Price (₹) | Total Selling Price (₹) | Profit (₹) |
|---------|---------------|-------------------|------------------|-----------------------|--------------------------|------------|
| Lot 1   | 100           | 10                | 40               | 1000                  | 4000                     | 3000       |
| Lot 2   | 50            | 20                | 40               | 1000                  | 2000                     | 1000       |
| **Total** | **150**       |                   |                  | **2000**              | **6000**                 | **4000**   |
_______________________________________________________________

Table 3: Remaining Active Stocks in Portfolio
After selling 150 shares, 150 shares remain.

| Lot No. | Quantity Remaining | Purchase Price (₹) | Total Cost (₹) |
|---------|--------------------|-------------------|---------------|
| Lot 2   | 50                 | 20                | 1000          |
| Lot 3   | 100                | 30                | 3000          |
| **Total** | **150**           | **Avg: ₹26.67**    | **4000**       |
_______________________________________________________________

Summary
Total Profit from sold stocks = ₹4000
Remaining Shares in Portfolio = 150 shares
New Average Price = ₹26.67
_______________________________________________________________

Key Features of the App

Track Purchases: Input the quantity and purchase price when stocks are bought.

FCFS-Based Sales: Automate the selection of which lot the sold stocks belong to, following the FCFS principle.

Profit/Loss Calculation: Clearly show the booked profit/loss when stocks are sold.

Active Portfolio: Display remaining stocks with updated quantities, costs, and average prices.
