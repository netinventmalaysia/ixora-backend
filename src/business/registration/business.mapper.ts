import { Business } from './business.entity';

export function mapBusinessToListItem(business: Business) {
    return {
        id: business.id,
        name: business.companyName,
        href: `/business/${business.id}`,
        status: 'Submitted',  // You can change this if you have status field
        createdBy: 'Current User',  // Replace with real data if available
        dueDate: business.createdAt.toLocaleDateString('en-GB'),
        dueDateTime: business.createdAt,
    };
}
