export function formatArabicPoints(points) {

    if (points === 1) return 'نقطة'
    if (points === 2) return 'نقطتان'
    if (points >= 3 && points <= 10) return `${points} نقاط`
    return `${points} نقطة`
}
