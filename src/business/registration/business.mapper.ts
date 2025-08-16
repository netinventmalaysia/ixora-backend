import { Business } from './business.entity';

export function mapBusinessToListItem(business: Business) {
    return {
        id: business.id,
        name: business.companyName,
        href: `/business/${business.id}`,
        status: business.status,
        createdBy: business.userId ?? 'Unknown',
        dueDate: business.createdAt.toLocaleDateString('en-GB'),
        dueDateTime: business.createdAt,
    };
}
