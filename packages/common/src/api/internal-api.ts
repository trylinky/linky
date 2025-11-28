'use client';

export class InternalApi {
  static async post(path: string, body?: any) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        method: 'POST',
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.ok) {
        return res.json();
      }

      return {
        success: false,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  static async put(path: string, body?: any) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        method: 'PUT',
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.ok) {
        return res.json();
      }

      return {
        success: false,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  static async get(path: string, body?: any) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      method: 'GET',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    return res.json();
  }

  static async delete(path: string, body?: any) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      method: 'DELETE',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    return res.json();
  }
}
