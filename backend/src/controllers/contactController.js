import { Contact } from '../models/Contact.js';

function applyDivisionFilter(query, user) {
  if (!user?.divisionAccess || user.divisionAccess.length === 0) return query;
  return query.where('divisions').in(user.divisionAccess);
}

export async function listContacts(req, res, next) {
  try {
    const { page = 1, limit = 20, division, category, leadSource, search } = req.query;
    const numericLimit = Math.min(Number(limit) || 20, 100);
    const numericPage = Math.max(Number(page) || 1, 1);

    let query = Contact.find();

    // Division filter: intersect requested division with user.divisionAccess
    if (division) {
      query = query.where('divisions').in([division]);
    } else if (req.user) {
      query = applyDivisionFilter(query, req.user);
    }

    if (category) {
      query = query.where('contactCategory').equals(category);
    }

    if (leadSource) {
      query = query.where('leadSource').equals(leadSource);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query = query.where({
        $or: [
          { name: regex },
          { emails: regex },
          { phones: regex },
        ],
      });
    }

    const [items, total] = await Promise.all([
      query
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit),
      Contact.countDocuments(query.getFilter()),
    ]);

    res.json({
      items,
      page: numericPage,
      limit: numericLimit,
      total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getContact(req, res, next) {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

export async function createContact(req, res, next) {
  try {
    const { name, address, phones, emails, leadSource, contactType, contactCategory, divisions, notes } = req.body;

    const contact = await Contact.create({
      name,
      address,
      phones,
      emails,
      leadSource,
      contactType,
      contactCategory,
      divisions,
      notes,
      activityLog: req.user
        ? [
            {
              userName: req.user.name,
              action: 'Created contact',
            },
          ]
        : [],
    });

    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
}

export async function updateContact(req, res, next) {
  try {
    const updates = req.body;
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    Object.assign(contact, updates);

    if (req.user) {
      contact.activityLog.push({
        userName: req.user.name,
        action: 'Updated contact',
      });
    }

    await contact.save();
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

export async function deleteContact(req, res, next) {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}