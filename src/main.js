/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const {discount, sale_price, quantity} = purchase;
   const decimalDiscount = discount / 100;
   const fullPrice = sale_price * quantity;
   const revenue = fullPrice * (1 - decimalDiscount);

   return revenue
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const {profit} = seller;

    if (index === 0) {
        return profit * 0.15
    }

    if (index === 1 || index === 2) {
        return profit * 0.1
    }

    if (index === total - 1) {
        return 0
    }

    return profit * 0.05
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    try {
        // @TODO: Проверка входных данных
        if (!data
            || !Array.isArray(data.sellers)
            || !Array.isArray(data.products)
            || !Array.isArray(data.purchase_records)
            || data.sellers.length === 0
            || data.products.length === 0
            || data.purchase_records.length === 0
        ) {
            throw new Error('Некорректные входные данные: данные должны содержать непустые массивы sellers, products и purchase_records');
        }

        // @TODO: Проверка наличия опций
        if (!options || typeof options !== 'object') {
            throw new Error('Некорректные опции: options должен быть объектом');
        }

        const { calculateRevenue, calculateBonus } = options;

        if (!calculateRevenue || !calculateBonus) {
            throw new Error('Некорректные опции: должны быть переданы функции calculateRevenue и calculateBonus');
        }

        if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
            throw new Error('Некорректные опции: calculateRevenue и calculateBonus должны быть функциями');
        }

        // @TODO: Подготовка промежуточных данных для сбора статистики
        const sellersStats = data.sellers.map(seller => ({
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {}
        }));

        // @TODO: Индексация продавцов и товаров для быстрого доступа
        const sellerIndex = Object.fromEntries(
            sellersStats.map(seller => [seller.id, seller])
        );

        const productIndex = Object.fromEntries(
            data.products.map(product => [product.sku, product])
        );

        // @TODO: Расчет выручки и прибыли для каждого продавца
        data.purchase_records.forEach(record => {
            const seller = sellerIndex[record.seller_id];
            
            seller.sales_count += 1;

            let totalRevenueFromRecord = 0;
            let totalProfitFromRecord = 0;

            record.items.forEach(item => {
                const product = productIndex[item.sku];
                const cost = product.purchase_price * item.quantity;
                const revenue = calculateRevenue(item, product);
                const profit = revenue - cost;
                
                totalRevenueFromRecord += revenue;
                totalProfitFromRecord += profit;

                if (!seller.products_sold[item.sku]) {
                    seller.products_sold[item.sku] = 0;
                }
                seller.products_sold[item.sku] += item.quantity;
            });

            seller.revenue += totalRevenueFromRecord;
            seller.profit += totalProfitFromRecord;
        });

        // @TODO: Сортировка продавцов по прибыли
        sellersStats.sort((sellerA, sellerB) => sellerB.profit - sellerA.profit);

        // @TODO: Назначение премий на основе ранжирования
        sellersStats.forEach((seller, index) => {
            seller.bonus = calculateBonus(index, sellersStats.length, seller);
            
            seller.top_products = Object.entries(seller.products_sold)
                .map(([sku, quantity]) => ({ sku, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10);
        });

        // @TODO: Подготовка итоговой коллекции с нужными полями
        const result = sellersStats.map(seller => ({
            seller_id: seller.id,
            name: seller.name,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: seller.top_products,
            bonus: +seller.bonus.toFixed(2)
        }));

        return result;

    } catch (error) {
        console.error('Error in analyzeSalesData:', error.message);
        return []
    }
}
